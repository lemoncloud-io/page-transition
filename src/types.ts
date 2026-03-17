import type { NavigateOptions, To } from 'react-router-dom';

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

/** Options for navigation with view transitions */
export interface TransitionNavigateOptions extends NavigateOptions {
    /**
     * Whether to use view transition animation.
     * @default true (false if replace: true)
     */
    transition?: boolean;

    /**
     * Animation direction. When specified, overrides automatic detection.
     * - 'forward': Slide/lift in
     * - 'back': Slide/lift out
     *
     * If not specified:
     * - Numeric negative (e.g., -1) → inferred as 'back'
     * - All other navigation → inferred as 'forward'
     *
     * @example
     * ```tsx
     * // Navigate to home with back animation
     * navigate('/home', { direction: 'back' });
     *
     * // Override -1 to use forward animation
     * navigate(-1, { direction: 'forward' });
     * ```
     */
    direction?: NavigationDirection;

    /**
     * Animation type. When specified, overrides platform-based animation.
     * - 'slide': iOS-style horizontal slide
     * - 'lift': Android-style vertical lift
     * - 'fade': Simple crossfade (good for modals)
     * - 'zoom': Scale with fade (good for galleries)
     * - 'none': Instant switch, no animation
     *
     * If not specified, uses platform-based default (slide for iOS, lift for Android).
     *
     * @example
     * ```tsx
     * // Modal-like page with fade
     * navigate('/modal', { animation: 'fade' });
     *
     * // Image gallery with zoom
     * navigate('/gallery/1', { animation: 'zoom' });
     *
     * // Instant switch (e.g., for deep links)
     * navigate('/reset', { animation: 'none' });
     * ```
     */
    animation?: AnimationType;
}

/** Navigate function with view transition support (returns Promise) */
export type NavigateWithTransitionFn = (to: To | number, options?: TransitionNavigateOptions) => Promise<void>;
