// Composables
export { useNavigateWithTransition } from './useNavigateWithTransition';

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
    TransitionCustomization,
    TransitionOptions,
    ViewTransition,
    ViewTransitionCallback,
} from '@lemoncloud/page-transition-core';
