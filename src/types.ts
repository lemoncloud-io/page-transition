import type { NavigateOptions, To } from 'react-router-dom';

/** Supported platform types for animations */
export type PlatformType = 'ios' | 'android';

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
     * @default true
     */
    transition?: boolean;
}

/** Navigate function with view transition support */
export type NavigateWithTransitionFn = (to: To | number, options?: TransitionNavigateOptions) => void;
