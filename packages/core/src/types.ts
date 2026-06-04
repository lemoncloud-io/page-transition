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

/**
 * Why a navigation skipped the View Transitions animation. Surfaced
 * via `TransitionOptions.onSkipped` so consumers can debug missing
 * animations or feed metrics.
 */
export type SkipReason =
    | 'unsupported'
    | 'reduced-motion'
    | 'animation-none'
    | 'aborted'
    | 'superseded';

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
     * Element that owns the scroll position for this navigation. When
     * set, scroll save/restore targets this element
     * (`scrollTop`/`scrollLeft`, `el.scrollTo`) instead of the window.
     *
     * Apps that move scrolling into a container — recommended inside iOS
     * WebViews, where a scrolled *document* makes WebKit capture the
     * `::view-transition-old(root)` snapshot from the top and flash the
     * leaving page — pass the container here so the library manages
     * restoration for them. The host must still keep the document itself
     * unscrolled (e.g. `body { overflow: hidden }`); the library cannot do
     * that part. See `docs/scrolling-and-view-transitions.md`.
     *
     * Accepts an element or a getter, resolved when the transition runs
     * (the element may mount after the hook/composable is created).
     */
    scrollRoot?: Element | (() => Element | null);

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

    /**
     * Caller-driven cancellation. Aborting before the transition starts
     * skips `navigationFn` entirely. Aborting mid-flight calls
     * `ViewTransition.skipTransition()`.
     */
    signal?: AbortSignal;

    /**
     * Notified when the navigation completes without animation. Useful
     * for analytics or surfacing "transition skipped" warnings while
     * debugging.
     */
    onSkipped?: (reason: SkipReason) => void;
}
