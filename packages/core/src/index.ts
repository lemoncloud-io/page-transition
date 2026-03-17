// Core transition function
export {
    executePageTransition,
    resolveTransitionClasses,
    cleanupTransitionClasses,
    isViewTransitionSupported,
} from './transition';

// Platform detection
export { detectPlatform, resolvePlatform } from './platform';

// Constants
export {
    BACK_NAVIGATION_CLASS,
    ANDROID_PLATFORM_CLASS,
    ANIMATION_FADE_CLASS,
    ANIMATION_ZOOM_CLASS,
    ANIMATION_NONE_CLASS,
    ANIMATION_LIFT_CLASS,
    ANIMATION_SLIDE_CLASS,
    ANIMATION_CLASSES,
} from './constants';

// Types
export type {
    PlatformType,
    NavigationDirection,
    AnimationType,
    PageTransitionConfig,
    TransitionOptions,
    ViewTransition,
    ViewTransitionCallback,
} from './types';
