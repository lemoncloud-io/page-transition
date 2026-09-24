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

    const enterEntry = (idx: number): void => {
        window.history.replaceState({ key: `sr-${idx}`, idx }, '', `/sr-${idx}`);
    };

    /**
     * Saves `scrollTop` against entry 0, then moves to entry 1 — the state a
     * back transition actually reads the store in, and the one the old
     * single-key fixture could not express.
     */
    const seedEntryToReturnTo = async (scrollTop: number): Promise<Element> => {
        const el = makeContainer();
        Object.defineProperty(el, 'scrollTop', { configurable: true, value: scrollTop });
        enterEntry(0);
        await executePageTransition(() => undefined, { direction: 'forward', scrollRoot: el });

        enterEntry(1);
        (el.scrollTo as ReturnType<typeof vi.fn>).mockClear();
        return el;
    };

    it('restores the saved container offset across a real history entry change', async () => {
        const el = await seedEntryToReturnTo(275);

        await executePageTransition(() => undefined, { direction: 'back', delta: -1, scrollRoot: el });

        expect(el.scrollTo).toHaveBeenCalledWith(0, 275);
    });

    it('defaults to one entry back when direction is "back" and no delta is given', async () => {
        const el = await seedEntryToReturnTo(130);

        await executePageTransition(() => undefined, { direction: 'back', scrollRoot: el });

        expect(el.scrollTo).toHaveBeenCalledWith(0, 130);
    });

    it('restores the destination offset when the traversal commits inside the callback', async () => {
        const el = await seedEntryToReturnTo(275);

        // The wrappers hold the callback open until the route has
        // committed, so by the time the store is read `history.state`
        // already belongs to the destination entry.
        await executePageTransition(
            async () => {
                enterEntry(0);
            },
            { direction: 'back', delta: -1, scrollRoot: el },
        );

        expect(el.scrollTo).toHaveBeenCalledWith(0, 275);
    });

    it('does not restore a stale offset for a push that only animates as back', async () => {
        // Entry 0 holds a saved offset from an earlier push; the document
        // is back on it, and now pushes away again with a back animation.
        const el = await seedEntryToReturnTo(640);
        enterEntry(0);

        await executePageTransition(
            () => {
                enterEntry(1);
            },
            { direction: 'back', delta: 0, scrollRoot: el },
        );

        expect(el.scrollTo).not.toHaveBeenCalledWith(0, 640);
    });

    it('discards the entry it saved when the navigation throws after committing', async () => {
        const el = makeContainer();
        Object.defineProperty(el, 'scrollTop', { configurable: true, value: 480 });
        enterEntry(0);

        await executePageTransition(
            () => {
                // React Router pushes synchronously, then something downstream
                // fails — the rollback must still name the entry it saved.
                enterEntry(1);
                throw new Error('navigation failed');
            },
            { direction: 'forward', scrollRoot: el },
        );

        expect(__defaultScrollStoreForTest.size()).toBe(0);
    });
});

describe('executePageTransition — onTiming', () => {
    // Mirrors the browser's promise order: `finished` fulfils even for a
    // skipped transition; only `ready` rejects on skip.
    const browserLikeVT = (cb: () => void | Promise<void>): ViewTransition => {
        let wasSkipped = false;
        const updateCallbackDone = Promise.resolve().then(cb);
        const ready = updateCallbackDone.then(() => {
            if (wasSkipped) throw new DOMException('Skipped', 'AbortError');
        });
        ready.catch(() => undefined);
        const finished = updateCallbackDone.then(() => ready.catch(() => undefined));
        return {
            updateCallbackDone,
            ready,
            finished,
            skipTransition: vi.fn(() => {
                wasSkipped = true;
            }),
        };
    };

    beforeEach(() => {
        __resetTransitionState();
        clearScrollStack();
        installStartViewTransition(browserLikeVT);
        vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    });

    afterEach(() => {
        uninstallStartViewTransition();
        vi.restoreAllMocks();
    });

    it('counts no frames and leaves no measures without onTiming', async () => {
        const raf = vi.spyOn(window, 'requestAnimationFrame');
        const measure = vi.spyOn(performance, 'measure');

        await executePageTransition(() => undefined);

        expect(raf).not.toHaveBeenCalled();
        expect(measure).not.toHaveBeenCalled();
    });

    it('reports a finished transition once with every phase', async () => {
        const onTiming = vi.fn();

        await executePageTransition(() => undefined, { onTiming });

        expect(onTiming).toHaveBeenCalledTimes(1);
        const timing = onTiming.mock.calls[0]?.[0];
        expect(timing.outcome).toBe('finished');
        expect(timing.capture).toEqual(expect.any(Number));
        expect(timing.update).toEqual(expect.any(Number));
        expect(timing.start).toEqual(expect.any(Number));
        expect(timing.animation).toEqual(expect.any(Number));
    });

    it('reports a superseded transition as skipped and the newer one as finished', async () => {
        const first = vi.fn();
        const second = vi.fn();

        const firstRun = executePageTransition(() => undefined, { onTiming: first });
        const secondRun = executePageTransition(() => undefined, { onTiming: second });
        await Promise.all([firstRun, secondRun]);

        expect(first).toHaveBeenCalledTimes(1);
        expect(first.mock.calls[0]?.[0]).toMatchObject({ outcome: 'skipped', animation: undefined });
        expect(second).toHaveBeenCalledTimes(1);
        expect(second.mock.calls[0]?.[0].outcome).toBe('finished');
    });

    it('reports a mid-flight abort as skipped', async () => {
        const onTiming = vi.fn();
        const controller = new AbortController();

        const run = executePageTransition(() => undefined, { onTiming, signal: controller.signal });
        controller.abort();
        await run;

        expect(onTiming).toHaveBeenCalledTimes(1);
        expect(onTiming.mock.calls[0]?.[0].outcome).toBe('skipped');
    });

    it('reports a throwing navigation as error', async () => {
        const onTiming = vi.fn();

        await executePageTransition(
            () => {
                throw new Error('boom');
            },
            { onTiming }
        );

        expect(onTiming).toHaveBeenCalledTimes(1);
        expect(onTiming.mock.calls[0]?.[0]).toMatchObject({
            outcome: 'error',
            update: undefined,
            start: undefined,
            animation: undefined,
        });
    });

    it('survives an onTiming that throws or rejects', async () => {
        await expect(
            executePageTransition(() => undefined, {
                onTiming: () => {
                    throw new Error('sync');
                },
            })
        ).resolves.toBeUndefined();
        await expect(
            executePageTransition(() => undefined, {
                onTiming: () => Promise.reject(new Error('async')),
            })
        ).resolves.toBeUndefined();
    });

    it('does not call onTiming for a navigation that skips the animation up front', async () => {
        const onTiming = vi.fn();

        await executePageTransition(() => undefined, { onTiming, animation: 'none' });

        expect(onTiming).not.toHaveBeenCalled();
    });
});
