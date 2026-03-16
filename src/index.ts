// Hooks
export { useNavigateWithTransition } from './hooks/useNavigateWithTransition';
export { useGoBack } from './hooks/useGoBack';

// Utils
export { detectPlatform, resolvePlatform } from './utils/platform';

// Constants
export { BACK_NAVIGATION_CLASS, ANDROID_PLATFORM_CLASS } from './constants';

// Types
export type {
    PlatformType,
    PageTransitionConfig,
    TransitionNavigateOptions,
    NavigateWithTransitionFn,
} from './types';
