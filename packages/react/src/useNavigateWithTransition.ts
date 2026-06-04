import { useCallback } from 'react';
import { flushSync } from 'react-dom';
import { useNavigate } from 'react-router-dom';

import { executePageTransition } from '@lemoncloud/page-transition-core';

import type { PageTransitionConfig } from '@lemoncloud/page-transition-core';
import type { To } from 'react-router-dom';
import type { NavigateWithTransitionFn, TransitionNavigateOptions } from './types';

/**
 * A wrapper hook around useNavigate that adds view transition support.
 * By default, all navigations will use view transitions with auto-detected platform animations.
 *
 * - `replace: true` automatically disables transition (for tab bar navigation)
 * - Use `transition: true` explicitly to override this behavior
 * - Returns a Promise that resolves when the transition completes
 * - Pass `signal` to abort an in-flight navigation
 * - Pass `onSkipped` to observe why a transition was bypassed
 *
 * @param config - Optional configuration for platform-specific animations
 * @returns Navigate function with view transition support
 *
 * @example
 * ```tsx
 * const navigate = useNavigateWithTransition();
 * await navigate('/settings');
 *
 * // Cancel an in-flight navigation
 * const controller = new AbortController();
 * navigate('/slow', { signal: controller.signal });
 * controller.abort();
 *
 * // Debug missing animations
 * navigate('/page', {
 *   onSkipped: (reason) => console.log('skipped:', reason),
 * });
 * ```
 */
export const useNavigateWithTransition = (config?: PageTransitionConfig): NavigateWithTransitionFn => {
    const navigate = useNavigate();

    const navigateWithTransition = useCallback(
        (to: To | number, options?: TransitionNavigateOptions): Promise<void> => {
            const {
                transition,
                direction,
                animation,
                customization,
                signal,
                onSkipped,
                legacyFlushSync,
                scrollRoot,
                ...navigateOptions
            } = options ?? {};

            // Honor an already-aborted signal even on the no-transition
            // branch, so the consumer contract ("aborting before the
            // navigation runs skips it entirely") holds regardless of
            // whether the call would have animated.
            if (signal?.aborted) {
                onSkipped?.('aborted');
                return Promise.resolve();
            }

            const shouldTransition = transition ?? !navigateOptions.replace;

            if (!shouldTransition) {
                if (typeof to === 'number') {
                    navigate(to);
                } else {
                    navigate(to, navigateOptions);
                }
                return Promise.resolve();
            }

            const runNavigate = (): void => {
                if (typeof to === 'number') {
                    navigate(to);
                } else {
                    navigate(to, navigateOptions);
                }
            };

            // Default: let React Router commit asynchronously inside the
            // View Transitions callback (the API natively awaits the
            // returned Promise). Falling back to `flushSync` is opt-in
            // via `legacyFlushSync` so consumers can escape a regression
            // without downgrading the library.
            const navigationFn = legacyFlushSync
                ? () => {
                      flushSync(runNavigate);
                  }
                : async () => {
                      runNavigate();
                      await Promise.resolve();
                  };

            const resolvedDirection = direction !== undefined
                ? direction
                : typeof to === 'number' && to < 0
                    ? 'back'
                    : 'forward';

            return executePageTransition(navigationFn, {
                animation,
                direction: resolvedDirection,
                config,
                customization,
                signal,
                onSkipped,
                scrollRoot,
            });
        },
        // Config values (platform, detectPlatform) are stable - only navigate reference matters
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [navigate, config?.platform, config?.detectPlatform]
    );

    return navigateWithTransition;
};
