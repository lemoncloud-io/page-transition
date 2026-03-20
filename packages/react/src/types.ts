import type { NavigateOptions, To } from 'react-router-dom';

import type { AnimationType, NavigationDirection, TransitionCustomization } from '@lemoncloud/page-transition-core';

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

    /**
     * Per-navigation customization for animation timing.
     * Overrides CSS custom properties for this single navigation.
     *
     * @example
     * ```tsx
     * navigate('/modal', {
     *   animation: 'fade',
     *   customization: { duration: 500, easing: 'ease-in-out' }
     * });
     * ```
     */
    customization?: TransitionCustomization;
}

/** Navigate function with view transition support (returns Promise) */
export type NavigateWithTransitionFn = (to: To | number, options?: TransitionNavigateOptions) => Promise<void>;
