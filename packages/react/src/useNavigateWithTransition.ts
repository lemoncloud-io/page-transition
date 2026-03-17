import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { executePageTransition, isViewTransitionSupported } from '@lemoncloud/page-transition-core';

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
 *
 * @param config - Optional configuration for platform-specific animations
 * @returns Navigate function with view transition support
 *
 * @example
 * ```tsx
 * // Auto-detect platform (default)
 * const navigate = useNavigateWithTransition();
 *
 * // Force iOS animations
 * const navigate = useNavigateWithTransition({ platform: 'ios' });
 *
 * // Custom platform detector
 * const navigate = useNavigateWithTransition({
 *   detectPlatform: () => myApp.isAndroid ? 'android' : 'ios'
 * });
 *
 * // Forward navigation with transition (default)
 * navigate('/settings');
 *
 * // Back navigation with transition
 * navigate(-1);
 *
 * // Navigate to path with back animation
 * navigate('/home', { direction: 'back' });
 *
 * // Modal with fade animation
 * navigate('/modal', { animation: 'fade' });
 *
 * // Gallery with zoom animation
 * navigate('/gallery/1', { animation: 'zoom' });
 *
 * // Navigation without transition (for tab switches)
 * navigate('/explore', { transition: false });
 *
 * // Replace navigation - no transition by default (tab bar)
 * navigate('/home', { replace: true });
 *
 * // Await transition completion
 * await navigate('/settings');
 * console.log('Transition complete!');
 * ```
 */
export const useNavigateWithTransition = (config?: PageTransitionConfig): NavigateWithTransitionFn => {
    const navigate = useNavigate();

    // Memoize config to prevent unnecessary re-renders when config is passed inline
    const stableConfig = useMemo(
        () => config,
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [config?.platform, config?.detectPlatform]
    );

    const navigateWithTransition = useCallback(
        (to: To | number, options?: TransitionNavigateOptions): Promise<void> => {
            const { transition, direction, animation, ...navigateOptions } = options ?? {};

            // replace: true defaults to no transition (tab bar navigation)
            // explicit transition: true/false overrides this behavior
            const shouldTransition = transition ?? !navigateOptions.replace;

            // Skip transition if not supported or disabled
            if (!shouldTransition || !isViewTransitionSupported()) {
                if (typeof to === 'number') {
                    navigate(to);
                } else {
                    navigate(to, navigateOptions);
                }
                return Promise.resolve();
            }

            // Determine if this is a back navigation:
            // 1. Explicit direction takes priority (overrides numeric detection)
            // 2. Numeric negative navigation (e.g., -1) when direction not specified
            const resolvedDirection = direction !== undefined
                ? direction
                : typeof to === 'number' && to < 0
                    ? 'back'
                    : 'forward';

            // Execute navigation with transition
            return executePageTransition(
                () => {
                    if (typeof to === 'number') {
                        navigate(to);
                    } else {
                        navigate(to, navigateOptions);
                    }
                },
                {
                    animation,
                    direction: resolvedDirection,
                    config: stableConfig,
                }
            );
        },
        [navigate, stableConfig]
    );

    return navigateWithTransition;
};
