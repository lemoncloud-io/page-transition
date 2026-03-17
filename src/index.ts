// Hooks
export { useNavigateWithTransition } from './hooks/useNavigateWithTransition';
export { useGoBack } from './hooks/useGoBack';

// Utils
export { detectPlatform, resolvePlatform } from './utils/platform';

// Constants
export {
    BACK_NAVIGATION_CLASS,
    ANDROID_PLATFORM_CLASS,
    ANIMATION_FADE_CLASS,
    ANIMATION_ZOOM_CLASS,
    ANIMATION_NONE_CLASS,
    ANIMATION_LIFT_CLASS,
    ANIMATION_SLIDE_CLASS,
} from './constants';

// Types
export type {
    PlatformType,
    NavigationDirection,
    AnimationType,
    PageTransitionConfig,
    TransitionNavigateOptions,
    NavigateWithTransitionFn,
    ViewTransition,
    ViewTransitionCallback,
} from './types';
