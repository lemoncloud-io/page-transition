import { createApp, defineComponent, h } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ViewTransition, ViewTransitionCallback } from '@lemoncloud/page-transition-core';
import type { App } from 'vue';
import type { Router, RouterHistory } from 'vue-router';

import { useNavigateWithTransition } from './useNavigateWithTransition';

/**
 * Regression guard for history hops on a real (browser) history.
 *
 * `router.go(-1)` is `history.go(-1)`, which only queues the traversal —
 * the router hears `popstate` in a later task. The View Transitions
 * callback used to resolve the moment `go()` returned, so the "new"
 * snapshot was taken of the page being left.
 *
 * The check: when the callback handed to `startViewTransition` settles,
 * the destination page is already in the document.
 */

const ROUTE_COMMIT_TIMEOUT_MS = 500;

type Navigation = ReturnType<typeof useNavigateWithTransition>;

const pageComponent = (name: string, capture: (navigation: Navigation) => void) =>
    defineComponent({
        setup() {
            capture(useNavigateWithTransition());
            return () => h('div', { 'data-page': name });
        },
    });

const currentPage = (): string | null =>
    document.querySelector('[data-page]')?.getAttribute('data-page') ?? null;

describe('history hop commit', () => {
    const original = document.startViewTransition;
    let pageAtCallbackEnd: (string | null)[] = [];
    let app: App;
    let router: Router;
    let history: RouterHistory;
    let navigation: Navigation;

    beforeEach(async () => {
        pageAtCallbackEnd = [];
        window.history.replaceState(null, '', '/');
        const startViewTransition = (callback: ViewTransitionCallback): ViewTransition => {
            const updateCallbackDone = Promise.resolve(callback()).then(() => {
                pageAtCallbackEnd.push(currentPage());
            });
            return {
                finished: updateCallbackDone,
                ready: updateCallbackDone,
                updateCallbackDone,
                skipTransition: vi.fn(),
            };
        };
        // This package type-checks against lib.dom's newer
        // `startViewTransition` signature, which the core mock shape
        // does not satisfy — install it the way `test/setup.ts` does.
        Object.defineProperty(document, 'startViewTransition', {
            value: startViewTransition,
            writable: true,
            configurable: true,
        });

        const capture = (captured: Navigation): void => {
            navigation = captured;
        };
        history = createWebHistory();
        router = createRouter({
            history,
            routes: [
                { path: '/', component: pageComponent('home', capture) },
                { path: '/detail', component: pageComponent('detail', capture) },
            ],
        });
        const root = document.createElement('div');
        document.body.appendChild(root);
        app = createApp({ render: () => h(router.currentRoute.value.matched[0]?.components?.default ?? 'div') });
        app.use(router);
        app.mount(root);
        await router.isReady();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
        app.unmount();
        history.destroy();
        document.body.innerHTML = '';
        Object.defineProperty(document, 'startViewTransition', {
            value: original,
            writable: true,
            configurable: true,
        });
    });

    const openDetail = async (): Promise<void> => {
        await navigation.navigate('/detail');
        expect(currentPage()).toBe('detail');
    };

    it('holds the transition callback open until the previous page has committed', async () => {
        await openDetail();

        void navigation.goBack();
        await vi.waitFor(() => expect(pageAtCallbackEnd).toHaveLength(2));

        expect(pageAtCallbackEnd).toEqual(['detail', 'home']);
    });

    it('settles as soon as a guard aborts the hop instead of waiting for the timeout', async () => {
        await openDetail();
        router.beforeEach(() => false);

        const startedAt = Date.now();
        await navigation.goBack();

        expect(Date.now() - startedAt).toBeLessThan(ROUTE_COMMIT_TIMEOUT_MS);
        expect(pageAtCallbackEnd).toEqual(['detail', 'detail']);

        // vue-router undoes an aborted pop with a forward `go()`; let it
        // land before the next test reuses the shared jsdom history.
        await vi.waitFor(() => expect(window.location.pathname).toBe('/detail'));
    });

    it('reports timings to onTiming passed to navigate and goBack', async () => {
        const onNavigateTiming = vi.fn();
        await navigation.navigate('/detail', { onTiming: onNavigateTiming });
        expect(onNavigateTiming).toHaveBeenCalledTimes(1);
        expect(onNavigateTiming.mock.calls[0]?.[0].outcome).toBe('finished');

        const onBackTiming = vi.fn();
        await navigation.goBack({ onTiming: onBackTiming });
        expect(onBackTiming).toHaveBeenCalledTimes(1);
        expect(onBackTiming.mock.calls[0]?.[0].outcome).toBe('finished');
    });

    describe('when the location never changes', () => {
        beforeEach(() => {
            vi.useFakeTimers();
            // jsdom keeps one history stack for the whole file, so a
            // real `go(-1)` here would land on an entry pushed by an
            // earlier test. Past the end of the stack a browser does
            // nothing — no `popstate`, no commit — which is the case
            // under test.
            vi.spyOn(window.history, 'go').mockImplementation(() => undefined);
        });

        it('settles the callback after the timeout when back has nowhere to go', async () => {
            void navigation.goBack();

            await vi.advanceTimersByTimeAsync(ROUTE_COMMIT_TIMEOUT_MS - 1);
            expect(pageAtCallbackEnd).toHaveLength(0);

            await vi.advanceTimersByTimeAsync(1);
            expect(pageAtCallbackEnd).toEqual(['home']);
        });

        it('releases the earlier waiter when a second back starts before it commits', async () => {
            void navigation.goBack();
            void navigation.goBack();

            // No timer has fired — the first callback settled because
            // the second hop released it, not because it timed out.
            await vi.advanceTimersByTimeAsync(0);
            expect(pageAtCallbackEnd).toEqual(['home']);

            await vi.advanceTimersByTimeAsync(ROUTE_COMMIT_TIMEOUT_MS);
            expect(pageAtCallbackEnd).toEqual(['home', 'home']);
        });
    });
});
