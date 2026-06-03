// Core transition function
export {
    executePageTransition,
    resolveTransitionClasses,
    cleanupTransitionClasses,
    isViewTransitionSupported,
} from './transition';

// Scroll management
export { pushScrollPosition, popScrollPosition, clearScrollStack } from './scroll';
export type { ScrollPosition } from './scroll';

// Platform detection
export { detectPlatform, resolvePlatform } from './platform';

// Constants
export {
    BACK_NAVIGATION_CLASS,
    ANDROID_PLATFORM_CLASS,
    ANIMATION_FADE_CLASS,
    ANIMATION_ZOOM_CLASS,
    ANIMATION_LIFT_CLASS,
    ANIMATION_SLIDE_CLASS,
    ANIMATION_CLASSES,
} from './constants';

// Reduced motion helper
export { isReducedMotion } from './reduced-motion';

// Types
export type {
    PlatformType,
    NavigationDirection,
    AnimationType,
    PageTransitionConfig,
    TransitionCustomization,
    TransitionOptions,
    SkipReason,
    ViewTransition,
    ViewTransitionCallback,
} from './types';
