import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { ANDROID_PLATFORM_CLASS, BACK_NAVIGATION_CLASS } from '../constants';
import { resolvePlatform } from '../utils/platform';

import type { NavigateWithTransitionFn, PageTransitionConfig, TransitionNavigateOptions } from '../types';
import type { To } from 'react-router-dom';

/**
 * A wrapper hook around useNavigate that adds view transition support.
 * By default, all navigations will use view transitions with auto-detected platform animations.
 *
 * - `replace: true` automatically disables transition (for tab bar navigation)
 * - Use `transition: true` explicitly to override this behavior
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
 * // Navigation without transition (for tab switches)
 * navigate('/explore', { transition: false });
 *
 * // Replace navigation - no transition by default (tab bar)
 * navigate('/home', { replace: true });
 *
 * // Replace with transition (explicit override)
 * navigate('/home', { replace: true, transition: true });
 * ```
 */
export const useNavigateWithTransition = (config?: PageTransitionConfig): NavigateWithTransitionFn => {
    const navigate = useNavigate();

    const navigateWithTransition = useCallback(
        (to: To | number, options?: TransitionNavigateOptions) => {
            const { transition, ...navigateOptions } = options ?? {};

            // replace: true defaults to no transition (tab bar navigation)
            // explicit transition: true/false overrides this behavior
            const shouldTransition = transition ?? !navigateOptions.replace;

            // Skip transition if not supported or disabled
            if (!shouldTransition || !document.startViewTransition) {
                if (typeof to === 'number') {
                    navigate(to);
                } else {
                    navigate(to, navigateOptions);
                }
                return;
            }

            // Detect platform for platform-specific animations
            const platform = resolvePlatform(config);
            const isAndroid = platform === 'android';

            // Add platform class for CSS-based animation selection
            if (isAndroid) {
                document.documentElement.classList.add(ANDROID_PLATFORM_CLASS);
            }

            // Add back-navigation class for reverse animation (numeric negative navigation)
            const isBack = typeof to === 'number' && to < 0;
            if (isBack) {
                document.documentElement.classList.add(BACK_NAVIGATION_CLASS);
            }

            // Start view transition
            const viewTransition = document.startViewTransition(() => {
                if (typeof to === 'number') {
                    navigate(to);
                } else {
                    navigate(to, navigateOptions);
                }
            });

            // Remove classes after transition completes
            viewTransition.finished.finally(() => {
                document.documentElement.classList.remove(BACK_NAVIGATION_CLASS, ANDROID_PLATFORM_CLASS);
            });
        },
        [navigate, config]
    );

    return navigateWithTransition;
};
