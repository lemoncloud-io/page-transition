import { nextTick } from 'vue';
import { useRouter } from 'vue-router';

import { executePageTransition, isViewTransitionSupported } from '@lemoncloud/page-transition-core';

import type { PageTransitionConfig } from '@lemoncloud/page-transition-core';
import type { RouteLocationRaw } from 'vue-router';
import type { NavigateWithTransitionFn, TransitionNavigateOptions } from './types';

const ROUTE_COMMIT_TIMEOUT_MS = 500;

/** Options `goBack` forwards to `navigate(-1, ...)`. */
export type GoBackOptions = Pick<
    TransitionNavigateOptions,
    'animation' | 'customization' | 'signal' | 'onSkipped' | 'onTiming' | 'scrollRoot' | 'delta'
>;

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
    goBack: (options?: GoBackOptions) => Promise<void>;
} => {
    const router = useRouter();
    let settleRouteCommit: (() => void) | null = null;

    // `router.go()` only queues the traversal — the router hears `popstate`
    // in a later task. `afterEach` fires once the route has been finalized
    // or a guard has aborted it, and the DOM follows on the next tick. A
    // guard that throws skips `afterEach`; that case falls back to the
    // timeout below.
    const waitForRouteCommit = (): Promise<void> => {
        // A second hop before the first has committed (double-tap on
        // back) releases the earlier waiter: core has already superseded
        // that transition, so nothing should keep its callback pending.
        settleRouteCommit?.();
        return new Promise<void>(resolve => {
            let timer: ReturnType<typeof setTimeout> | undefined;
            let removeGuard: (() => void) | undefined;
            const settle = (afterRender: Promise<void> = Promise.resolve()): void => {
                clearTimeout(timer);
                removeGuard?.();
                settleRouteCommit = null;
                void afterRender.then(resolve);
            };
            // `router.go()` past either end of the stack never navigates.
            // Rendering is paused while the View Transitions callback is
            // pending, so give up rather than freeze the page.
            timer = setTimeout(() => settle(), ROUTE_COMMIT_TIMEOUT_MS);
            removeGuard = router.afterEach(() => settle(nextTick()));
            settleRouteCommit = settle;
        });
    };

    const navigate: NavigateWithTransitionFn = (
        to: RouteLocationRaw | number,
        options?: TransitionNavigateOptions
    ): Promise<void> => {
        const {
            transition,
            direction,
            animation,
            replace,
            customization,
            signal,
            onSkipped,
            onTiming,
            scrollRoot,
            delta,
        } = options ?? {};

        // Honor an already-aborted signal even on the no-transition
        // branch, so the consumer contract holds regardless of which
        // path the call would have taken.
        if (signal?.aborted) {
            onSkipped?.('aborted');
            return Promise.resolve();
        }

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

        // Only a backward hop names an entry that can already hold a saved
        // offset; anything else must resolve to 0.
        const resolvedDelta = delta ?? (typeof to === 'number' && to < 0 ? to : 0);

        // Execute navigation with transition
        return executePageTransition(
            () => {
                if (typeof to === 'number') {
                    const committed = waitForRouteCommit();
                    router.go(to);
                    return committed;
                } else if (replace) {
                    return router.replace(to).then(() => {});
                } else {
                    return router.push(to).then(() => {});
                }
            },
            {
                animation,
                direction: resolvedDirection,
                delta: resolvedDelta,
                config,
                customization,
                signal,
                onSkipped,
                onTiming,
                scrollRoot,
            }
        );
    };

    const goBack = (options?: GoBackOptions): Promise<void> => {
        return navigate(-1, options);
    };

    return {
        navigate,
        goBack,
    };
};
