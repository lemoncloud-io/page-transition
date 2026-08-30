import type { NavigateOptions, To } from 'react-router-dom';

import type {
    AnimationType,
    NavigationDirection,
    SkipReason,
    TransitionCustomization,
} from '@lemoncloud/page-transition-core';

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

    /**
     * Caller-driven cancellation. Aborting before the navigation runs
     * skips the navigate call entirely. Aborting mid-flight skips the
     * View Transitions animation.
     */
    signal?: AbortSignal;

    /**
     * Notified when the navigation completes without an animation
     * (unsupported browser, reduced-motion, `animation: 'none'`,
     * aborted, or superseded by a newer call).
     */
    onSkipped?: (reason: SkipReason) => void;

    /**
     * @experimental Forces the legacy `flushSync` path used in
     * pre-v1.x releases. The default is now to let React Router
     * commit asynchronously inside the View Transitions callback,
     * which the API natively awaits. Set this to `true` only if you
     * hit a regression in a specific React Router version. Slated for
     * removal in v2.0.
     */
    legacyFlushSync?: boolean;

    /**
     * Element that owns the scroll position when the app scrolls a
     * container instead of the document. Scroll save/restore then targets
     * this element instead of the window. Recommended inside iOS WebViews
     * (the host must also keep the document unscrolled via CSS). Accepts an
     * element or a getter resolved at call time. See
     * `docs/scrolling-and-view-transitions.md`.
     */
    scrollRoot?: Element | (() => Element | null);

    /**
     * History hop count, derived from a *backward* numeric `to`
     * (`navigate(-1)` → `-1`); a path navigation or a forward hop resolves
     * to `0`. Only worth setting when you drive history yourself — see
     * `TransitionOptions.delta` in the core package for what it is for.
     */
    delta?: number;
}

/** Navigate function with view transition support (returns Promise) */
export type NavigateWithTransitionFn = (to: To | number, options?: TransitionNavigateOptions) => Promise<void>;
