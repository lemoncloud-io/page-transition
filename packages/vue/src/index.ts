// Composables
export { useNavigateWithTransition } from './useNavigateWithTransition';

// Re-export core utilities
export {
    executePageTransition,
    detectPlatform,
    resolvePlatform,
    isViewTransitionSupported,
    resolveTransitionClasses,
    cleanupTransitionClasses,
} from '@lemoncloud/page-transition-core';

// Re-export constants
export {
    BACK_NAVIGATION_CLASS,
    ANDROID_PLATFORM_CLASS,
    ANIMATION_FADE_CLASS,
    ANIMATION_ZOOM_CLASS,
    ANIMATION_NONE_CLASS,
    ANIMATION_LIFT_CLASS,
    ANIMATION_SLIDE_CLASS,
} from '@lemoncloud/page-transition-core';

// Types
export type {
    TransitionNavigateOptions,
    NavigateWithTransitionFn,
} from './types';

// Re-export core types
export type {
    PlatformType,
    NavigationDirection,
    AnimationType,
    PageTransitionConfig,
    TransitionOptions,
    ViewTransition,
    ViewTransitionCallback,
} from '@lemoncloud/page-transition-core';
