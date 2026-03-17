import { useRouter } from 'vue-router';

import { executePageTransition, isViewTransitionSupported } from '@lemoncloud/page-transition-core';

import type { PageTransitionConfig } from '@lemoncloud/page-transition-core';
import type { RouteLocationRaw } from 'vue-router';
import type { NavigateWithTransitionFn, TransitionNavigateOptions } from './types';

/**
 * A composable that wraps Vue Router's navigation with view transition support.
 * By default, all navigations will use view transitions with auto-detected platform animations.
 *
 * - `replace: true` automatically disables transition (for tab bar navigation)
 * - Use `transition: true` explicitly to override this behavior
 * - Returns a Promise that resolves when the transition completes
 *
 * @param config - Optional configuration for platform-specific animations
 * @returns Object containing navigate function and goBack function
 *
 * @example
 * ```vue
 * <script setup>
 * import { useNavigateWithTransition } from '@lemoncloud/vue-page-transition';
 *
 * // Auto-detect platform (default)
 * const { navigate, goBack } = useNavigateWithTransition();
 *
 * // Force iOS animations
 * const { navigate } = useNavigateWithTransition({ platform: 'ios' });
 *
 * // Forward navigation with transition (default)
 * navigate('/settings');
 *
 * // Back navigation with transition
 * goBack();
 * // or
 * navigate(-1);
 *
 * // Navigate to path with back animation
 * navigate('/home', { direction: 'back' });
 *
 * // Modal with fade animation
 * navigate('/modal', { animation: 'fade' });
 *
 * // Navigation without transition (for tab switches)
 * navigate('/explore', { transition: false });
 *
 * // Replace navigation - no transition by default (tab bar)
 * navigate('/home', { replace: true });
 *
 * // Await transition completion
 * await navigate('/settings');
 * console.log('Transition complete!');
 * </script>
 * ```
 */
export const useNavigateWithTransition = (config?: PageTransitionConfig): {
    navigate: NavigateWithTransitionFn;
    goBack: () => Promise<void>;
} => {
    const router = useRouter();

    const navigate: NavigateWithTransitionFn = (
        to: RouteLocationRaw | number,
        options?: TransitionNavigateOptions
    ): Promise<void> => {
        const { transition, direction, animation, replace } = options ?? {};

        // replace: true defaults to no transition (tab bar navigation)
        // explicit transition: true/false overrides this behavior
        const shouldTransition = transition ?? !replace;

        // Skip transition if not supported or disabled
        if (!shouldTransition || !isViewTransitionSupported()) {
            if (typeof to === 'number') {
                router.go(to);
                return Promise.resolve();
            } else {
                return router.push(to).then(() => {});
            }
        }

        // Determine if this is a back navigation:
        // 1. Explicit direction takes priority (overrides numeric detection)
        // 2. Numeric negative navigation (e.g., -1) when direction not specified
        const resolvedDirection = direction !== undefined
            ? direction
            : typeof to === 'number' && to < 0
                ? 'back'
                : 'forward';

        // Execute navigation with transition
        return executePageTransition(
            () => {
                if (typeof to === 'number') {
                    router.go(to);
                } else if (replace) {
                    return router.replace(to).then(() => {});
                } else {
                    return router.push(to).then(() => {});
                }
            },
            {
                animation,
                direction: resolvedDirection,
                config,
            }
        );
    };

    const goBack = (): Promise<void> => {
        return navigate(-1);
    };

    return {
        navigate,
        goBack,
    };
};
