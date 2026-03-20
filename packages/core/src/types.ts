// Re-export View Transitions API types
export type { ViewTransition, ViewTransitionCallback } from './types/view-transition';

/** Supported platform types for animations */
export type PlatformType = 'ios' | 'android';

/** Navigation direction for animation */
export type NavigationDirection = 'forward' | 'back';

/**
 * Animation type for transitions.
 * - 'slide': iOS-style horizontal slide (default for iOS/desktop)
 * - 'lift': Android-style vertical lift (default for Android)
 * - 'fade': Simple crossfade (good for modals, auth flows)
 * - 'zoom': Scale with fade (good for image galleries)
 * - 'none': Instant switch, no animation
 */
export type AnimationType = 'slide' | 'lift' | 'fade' | 'zoom' | 'none';

/** Configuration for page transitions */
export interface PageTransitionConfig {
    /**
     * Platform for animation style.
     * - 'ios': Horizontal slide animations
     * - 'android': Vertical lift animations with fade
     * - 'auto': Auto-detect using navigator.userAgent (default)
     */
    platform?: PlatformType | 'auto';

    /**
     * Custom platform detector function.
     * When provided, this overrides the `platform` option.
     */
    detectPlatform?: () => PlatformType | undefined;
}

/** Per-navigation customization for animation timing */
export interface TransitionCustomization {
    /** Animation duration in milliseconds */
    duration?: number;
    /** CSS easing function (e.g., 'ease-in-out', 'cubic-bezier(0.4, 0, 0.2, 1)') */
    easing?: string;
}

/** Options for executing a page transition */
export interface TransitionOptions {
    /**
     * Animation direction.
     * - 'forward': Slide/lift in
     * - 'back': Slide/lift out
     */
    direction?: NavigationDirection;

    /**
     * Animation type. When specified, overrides platform-based animation.
     */
    animation?: AnimationType;

    /**
     * Platform configuration for animations.
     */
    config?: PageTransitionConfig;

    /**
     * Per-navigation customization that overrides CSS custom properties.
     * Useful for one-off timing adjustments without changing global CSS variables.
     *
     * @example
     * ```ts
     * await executePageTransition(navigationFn, {
     *   animation: 'fade',
     *   customization: { duration: 500, easing: 'ease-in-out' }
     * });
     * ```
     */
    customization?: TransitionCustomization;
}
