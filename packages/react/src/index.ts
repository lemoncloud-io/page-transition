// Hooks
export { useNavigateWithTransition } from './useNavigateWithTransition';
export { useGoBack } from './useGoBack';

// Re-export core utilities (public API only)
export {
    detectPlatform,
    isViewTransitionSupported,
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
