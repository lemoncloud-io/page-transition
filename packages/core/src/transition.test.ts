import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { executePageTransition } from './transition';
import { clearScrollStack, __defaultScrollStoreForTest } from './scroll';
import { __resetTransitionState } from './transition-state';

import type { ViewTransition } from './types';

const installStartViewTransition = (
    impl: (cb: () => void | Promise<void>) => ViewTransition,
): void => {
    Object.defineProperty(document, 'startViewTransition', {
        value: vi.fn(impl),
        writable: true,
        configurable: true,
    });
};

const uninstallStartViewTransition = (): void => {
    Object.defineProperty(document, 'startViewTransition', {
        value: undefined,
        writable: true,
        configurable: true,
    });
};

const fakeVT = (skip = vi.fn()): ViewTransition => ({
    finished: Promise.resolve(),
    ready: Promise.resolve(),
    updateCallbackDone: Promise.resolve(),
    skipTransition: skip,
});

describe('executePageTransition — skip reasons', () => {
    beforeEach(() => {
        __resetTransitionState();
        clearScrollStack();
        installStartViewTransition((cb) => {
            const result = cb();
            const vt = fakeVT();
            if (result && typeof (result as Promise<void>).then === 'function') {
                vt.finished = (result as Promise<void>).then(
                    () => undefined,
                    () => undefined,
                );
            }
            return vt;
        });
    });

    afterEach(() => {
        uninstallStartViewTransition();
    });

    it('fires onSkipped("unsupported") when View Transitions API is missing', async () => {
        uninstallStartViewTransition();
        const onSkipped = vi.fn();
        const navigationFn = vi.fn();

        await executePageTransition(navigationFn, { onSkipped });

        expect(onSkipped).toHaveBeenCalledWith('unsupported');
        expect(navigationFn).toHaveBeenCalled();
    });

    it('fires onSkipped("aborted") when signal is already aborted', async () => {
        const controller = new AbortController();
        controller.abort();
        const onSkipped = vi.fn();
        const navigationFn = vi.fn();

        await executePageTransition(navigationFn, { signal: controller.signal, onSkipped });

        expect(onSkipped).toHaveBeenCalledWith('aborted');
        expect(navigationFn).not.toHaveBeenCalled();
    });

    it('fires onSkipped("reduced-motion") when matchMedia matches reduce', async () => {
        const originalMatchMedia = window.matchMedia;
        window.matchMedia = vi.fn().mockReturnValue({ matches: true }) as typeof window.matchMedia;
        const onSkipped = vi.fn();
        const navigationFn = vi.fn();

        await executePageTransition(navigationFn, { onSkipped });

        expect(onSkipped).toHaveBeenCalledWith('reduced-motion');
        expect(navigationFn).toHaveBeenCalled();
        window.matchMedia = originalMatchMedia;
    });
});

describe('executePageTransition — scroll balance on error', () => {
    beforeEach(() => {
        __resetTransitionState();
        clearScrollStack();
        window.history.replaceState({ key: 'k-error' }, '', '/error');
    });

    afterEach(() => {
        uninstallStartViewTransition();
    });

    it('pops the pushed scroll entry when navigationFn throws inside the View Transitions callback', async () => {
        installStartViewTransition((cb) => {
            const vt = fakeVT();
            // Simulate the browser: await the async callback; if it
            // throws, the `finished` promise rejects.
            const settled = Promise.resolve()
                .then(() => cb())
                .then(
                    () => undefined,
                    () => undefined,
                );
            vt.finished = settled;
            return vt;
        });

        const navigationFn = vi.fn(() => {
            throw new Error('router blew up');
        });

        const sizeBefore = __defaultScrollStoreForTest.size();
        await executePageTransition(navigationFn, { direction: 'forward' });

        expect(__defaultScrollStoreForTest.size()).toBe(sizeBefore);
    });

    it('pops the pushed scroll entry when startViewTransition itself throws', async () => {
        installStartViewTransition(() => {
            throw new Error('vt unavailable');
        });

        const sizeBefore = __defaultScrollStoreForTest.size();
        await executePageTransition(() => undefined, { direction: 'forward' });

        expect(__defaultScrollStoreForTest.size()).toBe(sizeBefore);
    });
});

describe('executePageTransition — async onSkipped resilience', () => {
    beforeEach(() => {
        __resetTransitionState();
        clearScrollStack();
    });

    it('swallows a rejected Promise returned from onSkipped', async () => {
        uninstallStartViewTransition();
        const onSkipped = vi.fn(() => Promise.reject(new Error('analytics down')));
        const unhandled = vi.fn();
        process.on('unhandledRejection', unhandled);

        await executePageTransition(() => undefined, { onSkipped });

        // Give the rejection a microtask to surface if uncaught.
        await new Promise((r) => setTimeout(r, 0));

        expect(onSkipped).toHaveBeenCalledWith('unsupported');
        expect(unhandled).not.toHaveBeenCalled();
        process.off('unhandledRejection', unhandled);
    });
});

describe('executePageTransition — scrollRoot', () => {
    beforeEach(() => {
        __resetTransitionState();
        clearScrollStack();
        window.history.replaceState({ key: 'sr-key' }, '', '/sr');
        installStartViewTransition((cb) => {
            const result = cb();
            const vt = fakeVT();
            if (result && typeof (result as Promise<void>).then === 'function') {
                vt.finished = (result as Promise<void>).then(
                    () => undefined,
                    () => undefined,
                );
            }
            return vt;
        });
    });

    afterEach(() => {
        uninstallStartViewTransition();
    });

    const makeContainer = () => {
        const el = document.createElement('div');
        Object.defineProperty(el, 'scrollLeft', { configurable: true, value: 0 });
        Object.defineProperty(el, 'scrollTop', { configurable: true, value: 0 });
        el.scrollTo = vi.fn();
        return el;
    };

    it('resets the container (not the window) to top on forward navigation', async () => {
        const el = makeContainer();
        const windowScrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});

        await executePageTransition(() => undefined, { direction: 'forward', scrollRoot: el });

        expect(el.scrollTo).toHaveBeenCalledWith(0, 0);
        expect(windowScrollTo).not.toHaveBeenCalled();
        windowScrollTo.mockRestore();
    });

    it('accepts a getter form resolved at transition time', async () => {
        const el = makeContainer();

        await executePageTransition(() => undefined, {
            direction: 'forward',
            scrollRoot: () => el,
        });

        expect(el.scrollTo).toHaveBeenCalledWith(0, 0);
    });

    it('restores the saved container offset on back navigation', async () => {
        const el = makeContainer();
        // Seed a saved position for the current history key.
        Object.defineProperty(el, 'scrollTop', { configurable: true, value: 275 });
        await executePageTransition(() => undefined, { direction: 'forward', scrollRoot: el });
        (el.scrollTo as ReturnType<typeof vi.fn>).mockClear();

        await executePageTransition(() => undefined, { direction: 'back', scrollRoot: el });

        expect(el.scrollTo).toHaveBeenCalledWith(0, 275);
    });
});
