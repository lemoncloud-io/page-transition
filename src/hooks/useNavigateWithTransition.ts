import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import {
    ANDROID_PLATFORM_CLASS,
    ANIMATION_FADE_CLASS,
    ANIMATION_LIFT_CLASS,
    ANIMATION_NONE_CLASS,
    ANIMATION_SLIDE_CLASS,
    ANIMATION_ZOOM_CLASS,
    BACK_NAVIGATION_CLASS,
} from '../constants';
import { resolvePlatform } from '../utils/platform';

import type { AnimationType, NavigateWithTransitionFn, PageTransitionConfig, TransitionNavigateOptions } from '../types';
import type { To } from 'react-router-dom';

/** All animation CSS classes for cleanup */
const ANIMATION_CLASSES = [
    BACK_NAVIGATION_CLASS,
    ANDROID_PLATFORM_CLASS,
    ANIMATION_FADE_CLASS,
    ANIMATION_ZOOM_CLASS,
    ANIMATION_NONE_CLASS,
    ANIMATION_LIFT_CLASS,
    ANIMATION_SLIDE_CLASS,
] as const;

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
            if (!shouldTransition || !document.startViewTransition) {
                if (typeof to === 'number') {
                    navigate(to);
                } else {
                    navigate(to, navigateOptions);
                }
                return Promise.resolve();
            }

            // Handle 'none' animation type - instant navigation without transition
            if (animation === 'none') {
                if (typeof to === 'number') {
                    navigate(to);
                } else {
                    navigate(to, navigateOptions);
                }
                return Promise.resolve();
            }

            // Determine animation classes based on options
            const classesToAdd: string[] = [];

            // Animation type handling
            if (animation) {
                // Explicit animation type overrides platform detection
                const animationClassMap: Record<Exclude<AnimationType, 'none'>, string> = {
                    fade: ANIMATION_FADE_CLASS,
                    zoom: ANIMATION_ZOOM_CLASS,
                    lift: ANIMATION_LIFT_CLASS,
                    slide: ANIMATION_SLIDE_CLASS,
                };
                classesToAdd.push(animationClassMap[animation]);
            } else {
                // Use platform-based animation (existing behavior)
                const platform = resolvePlatform(stableConfig);
                if (platform === 'android') {
                    classesToAdd.push(ANDROID_PLATFORM_CLASS);
                }
            }

            // Determine if this is a back navigation:
            // 1. Explicit direction takes priority (overrides numeric detection)
            // 2. Numeric negative navigation (e.g., -1) when direction not specified
            const isBack = direction !== undefined
                ? direction === 'back'
                : typeof to === 'number' && to < 0;
            if (isBack) {
                classesToAdd.push(BACK_NAVIGATION_CLASS);
            }

            // Add all classes
            classesToAdd.forEach(cls => document.documentElement.classList.add(cls));

            // Start view transition
            const viewTransition = document.startViewTransition(() => {
                if (typeof to === 'number') {
                    navigate(to);
                } else {
                    navigate(to, navigateOptions);
                }
            });

            // Remove all animation classes after transition completes
            return viewTransition.finished.finally(() => {
                ANIMATION_CLASSES.forEach(cls => document.documentElement.classList.remove(cls));
            });
        },
        [navigate, stableConfig]
    );

    return navigateWithTransition;
};
