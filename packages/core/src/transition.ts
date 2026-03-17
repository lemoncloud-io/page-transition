import {
    ANDROID_PLATFORM_CLASS,
    ANIMATION_CLASSES,
    ANIMATION_FADE_CLASS,
    ANIMATION_LIFT_CLASS,
    ANIMATION_SLIDE_CLASS,
    ANIMATION_ZOOM_CLASS,
    BACK_NAVIGATION_CLASS,
} from './constants';
import { resolvePlatform } from './platform';

import type { AnimationType, TransitionOptions } from './types';

/**
 * Resolves CSS classes to add based on transition options.
 *
 * @param options - Transition options
 * @returns Array of CSS class names to add
 */
export const resolveTransitionClasses = (options?: TransitionOptions): string[] => {
    const classesToAdd: string[] = [];

    // Animation type handling
    if (options?.animation && options.animation !== 'none') {
        const animationClassMap: Record<Exclude<AnimationType, 'none'>, string> = {
            fade: ANIMATION_FADE_CLASS,
            zoom: ANIMATION_ZOOM_CLASS,
            lift: ANIMATION_LIFT_CLASS,
            slide: ANIMATION_SLIDE_CLASS,
        };
        classesToAdd.push(animationClassMap[options.animation]);
    } else if (!options?.animation) {
        // Use platform-based animation (default behavior)
        const platform = resolvePlatform(options?.config);
        if (platform === 'android') {
            classesToAdd.push(ANDROID_PLATFORM_CLASS);
        }
    }

    // Direction handling
    if (options?.direction === 'back') {
        classesToAdd.push(BACK_NAVIGATION_CLASS);
    }

    return classesToAdd;
};

/**
 * Cleans up all animation-related CSS classes from the document element.
 */
export const cleanupTransitionClasses = (): void => {
    ANIMATION_CLASSES.forEach(cls => document.documentElement.classList.remove(cls));
};

/**
 * Checks if the View Transitions API is supported in the current browser.
 *
 * @returns true if startViewTransition is available
 */
export const isViewTransitionSupported = (): boolean => {
    return typeof document !== 'undefined' && typeof document.startViewTransition === 'function';
};

/**
 * Executes a page transition using the View Transitions API.
 *
 * This is the core framework-agnostic function that handles:
 * 1. Browser support detection
 * 2. CSS class management for animations
 * 3. View Transition execution
 * 4. Cleanup after transition
 *
 * @param navigationFn - Function that performs the actual navigation/DOM update
 * @param options - Transition options (animation type, direction, platform config)
 * @returns Promise that resolves when the transition completes
 *
 * @example
 * ```ts
 * // Basic usage with any router
 * await executePageTransition(() => {
 *   router.push('/new-page');
 * });
 *
 * // With back animation
 * await executePageTransition(() => {
 *   router.back();
 * }, { direction: 'back' });
 *
 * // With fade animation
 * await executePageTransition(() => {
 *   router.push('/modal');
 * }, { animation: 'fade' });
 *
 * // Force Android-style animation
 * await executePageTransition(() => {
 *   router.push('/page');
 * }, { config: { platform: 'android' } });
 * ```
 */
export const executePageTransition = (
    navigationFn: () => void | Promise<void>,
    options?: TransitionOptions
): Promise<void> => {
    // Skip transition if not supported
    if (!isViewTransitionSupported()) {
        const result = navigationFn();
        return result instanceof Promise ? result : Promise.resolve();
    }

    // Handle 'none' animation type - instant navigation without transition
    if (options?.animation === 'none') {
        const result = navigationFn();
        return result instanceof Promise ? result : Promise.resolve();
    }

    // Determine animation classes based on options
    const classesToAdd = resolveTransitionClasses(options);

    // Add all classes
    classesToAdd.forEach(cls => document.documentElement.classList.add(cls));

    // Start view transition
    const viewTransition = document.startViewTransition!(() => {
        return navigationFn();
    });

    // Remove all animation classes after transition completes
    return viewTransition.finished.finally(() => {
        cleanupTransitionClasses();
    });
};
