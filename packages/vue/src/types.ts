import type { RouteLocationRaw } from 'vue-router';

import type {
    AnimationType,
    NavigationDirection,
    SkipReason,
    TransitionCustomization,
} from '@lemoncloud/page-transition-core';

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

    /**
     * Per-navigation customization for animation timing.
     * Overrides CSS custom properties for this single navigation.
     *
     * @example
     * ```vue
     * <script setup>
     * const { navigate } = useNavigateWithTransition();
     * navigate('/modal', {
     *   animation: 'fade',
     *   customization: { duration: 500, easing: 'ease-in-out' }
     * });
     * </script>
     * ```
     */
    customization?: TransitionCustomization;

    /**
     * Caller-driven cancellation. Aborting before the navigation runs
     * skips the navigate call entirely. Aborting mid-flight skips the
     * View Transitions animation.
     */
    signal?: AbortSignal;

    /**
     * Notified when the navigation completes without animation.
     */
    onSkipped?: (reason: SkipReason) => void;

    /**
     * Element that owns the scroll position when the app scrolls a
     * container instead of the document. Scroll save/restore then targets
     * this element instead of the window. Recommended inside iOS WebViews
     * (the host must also keep the document unscrolled via CSS). Accepts an
     * element or a getter resolved at call time. See
     * `docs/scrolling-and-view-transitions.md`.
     */
    scrollRoot?: Element | (() => Element | null);
}

/** Navigate function with view transition support (returns Promise) */
export type NavigateWithTransitionFn = (to: RouteLocationRaw | number, options?: TransitionNavigateOptions) => Promise<void>;
