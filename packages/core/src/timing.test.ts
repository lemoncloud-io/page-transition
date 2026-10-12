import { describe, expect, it, vi } from 'vitest';

import { createTransitionTimer } from './timing';

import type { TimerDeps } from './timing';
import type { ViewTransition } from './types';

interface Deferred {
    promise: Promise<void>;
    resolve: () => void;
    // Mirrors the Promise executor's `reject`, which accepts any reason.
    reject: (err: unknown) => void;
}

const deferred = (): Deferred => {
    let resolve!: () => void;
    let reject!: (err: unknown) => void; // same Promise-executor reason type
    const promise = new Promise<void>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
};

const controllableVT = (): { vt: ViewTransition; updated: Deferred; ready: Deferred } => {
    const updated = deferred();
    const ready = deferred();
    const vt: ViewTransition = {
        updateCallbackDone: updated.promise,
        ready: ready.promise,
        finished: Promise.resolve(),
        skipTransition: vi.fn(),
    };
    return { vt, updated, ready };
};

const flush = async (): Promise<void> => {
    await Promise.resolve();
    await Promise.resolve();
};

const fakeDeps = (): {
    deps: TimerDeps;
    setNow: (t: number) => void;
    tick: (t: number) => void;
    cancelFrame: ReturnType<typeof vi.fn>;
    measure: ReturnType<typeof vi.fn>;
} => {
    let now = 0;
    let pending: ((time: number) => void) | undefined;
    const cancelFrame = vi.fn(() => {
        pending = undefined;
    });
    const measure = vi.fn();
    const deps: TimerDeps = {
        now: () => now,
        requestFrame: cb => {
            pending = cb;
            return 1;
        },
        cancelFrame,
        measure,
    };
    const tick = (t: number): void => {
        now = t;
        const cb = pending;
        pending = undefined;
        cb?.(t);
    };
    return { deps, setNow: t => (now = t), tick, cancelFrame, measure };
};

describe('createTransitionTimer', () => {
    it('reports every phase and the frame stats of a finished transition', async () => {
        const { deps, setNow, tick, measure } = fakeDeps();
        const { vt, updated, ready } = controllableVT();

        const timer = createTransitionTimer(deps);
        setNow(10);
        timer.markCallback();
        timer.track(vt);
        setNow(110);
        updated.resolve();
        await flush();
        setNow(130);
        ready.resolve();
        await flush();
        tick(146);
        tick(162);
        tick(212);
        setNow(510);

        expect(timer.finish(false)).toEqual({
            outcome: 'finished',
            capture: 10,
            update: 100,
            start: 20,
            animation: 380,
            frames: 3,
            maxFrameGap: 50,
        });
        expect(measure).toHaveBeenCalledWith('pt:capture', 0, 10);
        expect(measure).toHaveBeenCalledWith('pt:update', 10, 110);
        expect(measure).toHaveBeenCalledWith('pt:start', 110, 130);
        expect(measure).toHaveBeenCalledWith('pt:animation', 130, 510);
    });

    it('stops counting frames once finished', async () => {
        const { deps, cancelFrame } = fakeDeps();
        const { vt, updated, ready } = controllableVT();

        const timer = createTransitionTimer(deps);
        timer.markCallback();
        timer.track(vt);
        updated.resolve();
        ready.resolve();
        await flush();
        timer.finish(false);

        expect(cancelFrame).toHaveBeenCalledWith(1);
    });

    it('reports a skipped transition without animation or frame stats', async () => {
        const { deps, setNow, tick } = fakeDeps();
        const { vt, updated, ready } = controllableVT();

        const timer = createTransitionTimer(deps);
        setNow(5);
        timer.markCallback();
        timer.track(vt);
        setNow(50);
        updated.resolve();
        await flush();
        setNow(60);
        ready.resolve();
        await flush();
        tick(80);

        expect(timer.finish(true)).toEqual({
            outcome: 'skipped',
            capture: 5,
            update: 45,
            start: 10,
            animation: undefined,
            frames: undefined,
            maxFrameGap: undefined,
        });
    });

    it('reads a rejected ready as skipped without leaking the rejection', async () => {
        const { deps } = fakeDeps();
        const { vt, updated, ready } = controllableVT();

        const timer = createTransitionTimer(deps);
        timer.markCallback();
        timer.track(vt);
        updated.resolve();
        ready.reject(new DOMException('Skipped', 'AbortError'));
        await flush();

        const timing = timer.finish(false);
        expect(timing.outcome).toBe('skipped');
        expect(timing.start).toBeUndefined();
    });

    it('reports a failed callback as error with no phase past capture', async () => {
        const { deps, setNow } = fakeDeps();
        const { vt, updated, ready } = controllableVT();

        const timer = createTransitionTimer(deps);
        setNow(3);
        timer.markCallback();
        timer.track(vt);
        updated.reject(new Error('boom'));
        ready.reject(new Error('boom'));
        await flush();

        expect(timer.finish(false)).toEqual({
            outcome: 'error',
            capture: 3,
            update: undefined,
            start: undefined,
            animation: undefined,
            frames: undefined,
            maxFrameGap: undefined,
        });
    });

    it('leaves frame stats undefined without requestAnimationFrame', async () => {
        const { deps } = fakeDeps();
        const { vt, updated, ready } = controllableVT();

        const timer = createTransitionTimer({ now: deps.now, measure: deps.measure });
        timer.markCallback();
        timer.track(vt);
        updated.resolve();
        ready.resolve();
        await flush();

        const timing = timer.finish(false);
        expect(timing.outcome).toBe('finished');
        expect(timing.animation).toBe(0);
        expect(timing.frames).toBeUndefined();
        expect(timing.maxFrameGap).toBeUndefined();
    });
});
