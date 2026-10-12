import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';

import { executePageTransition } from '@lemoncloud/page-transition-core';

import type { PageTransitionConfig } from '@lemoncloud/page-transition-core';
import type { To } from 'react-router-dom';
import type { NavigateWithTransitionFn, TransitionNavigateOptions } from './types';

const LOCATION_COMMIT_TIMEOUT_MS = 500;

// `useLayoutEffect` warns during server rendering on React 18.
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

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
    const location = useLocation();
    const settleLocationCommit = useRef<(() => void) | null>(null);

    // The cleanup runs while React commits the next location (or unmounts
    // this component, which a back navigation usually does) — either way
    // the destination DOM is in place one microtask later.
    useIsomorphicLayoutEffect(
        () => () => {
            settleLocationCommit.current?.();
            settleLocationCommit.current = null;
        },
        [location.key]
    );

    const waitForLocationCommit = useCallback((): Promise<void> => {
        // A second hop before the first has committed (double-tap on
        // back) releases the earlier waiter: core has already superseded
        // that transition, so nothing should keep its callback pending.
        settleLocationCommit.current?.();
        return new Promise<void>(resolve => {
            // `history.go()` past either end of the stack, or a blocked
            // navigation, never changes the location. Rendering is paused
            // while the View Transitions callback is pending, so give up
            // rather than freeze the page.
            const timer = setTimeout(() => {
                settleLocationCommit.current = null;
                resolve();
            }, LOCATION_COMMIT_TIMEOUT_MS);
            settleLocationCommit.current = () => {
                clearTimeout(timer);
                void Promise.resolve().then(resolve);
            };
        });
    }, []);

    const navigateWithTransition = useCallback(
        (to: To | number, options?: TransitionNavigateOptions): Promise<void> => {
            const {
                transition,
                direction,
                animation,
                customization,
                signal,
                onSkipped,
                onTiming,
                legacyFlushSync,
                scrollRoot,
                delta,
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
            //
            // A numeric hop is `history.go()`, which only queues the
            // traversal: the router hears `popstate` in a later task, so
            // neither a microtask nor `flushSync` has anything to wait on.
            // Hold the callback open until the new location has committed
            // — otherwise the "new" snapshot is the page being left and
            // the back scroll offset lands on the wrong DOM.
            const navigationFn =
                typeof to === 'number'
                    ? async () => {
                          const committed = waitForLocationCommit();
                          if (legacyFlushSync) {
                              flushSync(runNavigate);
                          } else {
                              runNavigate();
                          }
                          await committed;
                      }
                    : legacyFlushSync
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

            // Only a backward hop names an entry that can already hold a
            // saved offset; anything else must resolve to 0.
            const resolvedDelta = delta ?? (typeof to === 'number' && to < 0 ? to : 0);

            return executePageTransition(navigationFn, {
                animation,
                direction: resolvedDirection,
                delta: resolvedDelta,
                config,
                customization,
                signal,
                onSkipped,
                onTiming,
                scrollRoot,
            });
        },
        // Config values (platform, detectPlatform) are stable - only navigate reference matters
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [navigate, waitForLocationCommit, config?.platform, config?.detectPlatform]
    );

    return navigateWithTransition;
};
