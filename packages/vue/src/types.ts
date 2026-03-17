import type { RouteLocationRaw } from 'vue-router';

import type { AnimationType, NavigationDirection, PageTransitionConfig } from '@lemoncloud/page-transition-core';

// Re-export core types for convenience
export type { PlatformType, NavigationDirection, AnimationType, PageTransitionConfig } from '@lemoncloud/page-transition-core';

/** Options for navigation with view transitions */
export interface TransitionNavigateOptions {
    /**
     * Whether to use view transition animation.
     * @default true (false if replace: true)
     */
    transition?: boolean;

    /**
     * Replace the current entry in the history instead of pushing a new one.
     * @default false
     */
    replace?: boolean;

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
     * ```vue
     * <script setup>
     * const { navigate } = useNavigateWithTransition();
     *
     * // Navigate to home with back animation
     * navigate('/home', { direction: 'back' });
     *
     * // Override -1 to use forward animation
     * navigate(-1, { direction: 'forward' });
     * </script>
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
     * ```vue
     * <script setup>
     * const { navigate } = useNavigateWithTransition();
     *
     * // Modal-like page with fade
     * navigate('/modal', { animation: 'fade' });
     *
     * // Image gallery with zoom
     * navigate('/gallery/1', { animation: 'zoom' });
     *
     * // Instant switch (e.g., for deep links)
     * navigate('/reset', { animation: 'none' });
     * </script>
     * ```
     */
    animation?: AnimationType;
}

/** Navigate function with view transition support (returns Promise) */
export type NavigateWithTransitionFn = (to: RouteLocationRaw | number, options?: TransitionNavigateOptions) => Promise<void>;
