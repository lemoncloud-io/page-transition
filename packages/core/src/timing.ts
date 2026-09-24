import type { TransitionTiming, ViewTransition } from './types';

/**
 * Clock, frame scheduler and timeline sink the timer reads. Injected so
 * tests drive time deterministically; `createTransitionTimer()` without
 * arguments uses the browser's.
 */
export interface TimerDeps {
    now: () => number;
    requestFrame?: (callback: (time: number) => void) => number;
    cancelFrame?: (handle: number) => void;
    measure?: (name: string, start: number, end: number) => void;
}

export interface TransitionTimer {
    /** Call on entering the View Transitions callback. */
    markCallback: () => void;
    /** Subscribe to the transition's `updateCallbackDone` and `ready`. */
    track: (vt: ViewTransition) => void;
    /** Call once `finished` has settled. `skipped` = the caller skipped it. */
    finish: (skipped: boolean) => TransitionTiming;
}

const measureOnTimeline = (name: string, start: number, end: number): void => {
    try {
        performance.measure(name, { start, end });
    } catch {
        // Engines without the options form of `measure` — the timeline
        // entry is a convenience, `onTiming` still carries the numbers.
    }
};

const browserDeps = (): TimerDeps => {
    const hasPerformance = typeof performance !== 'undefined';
    const hasFrames = typeof requestAnimationFrame === 'function' && typeof cancelAnimationFrame === 'function';
    const hasMeasure = hasPerformance && typeof performance.measure === 'function';
    return {
        now: hasPerformance ? () => performance.now() : () => Date.now(),
        requestFrame: hasFrames ? callback => requestAnimationFrame(callback) : undefined,
        cancelFrame: hasFrames ? handle => cancelAnimationFrame(handle) : undefined,
        measure: hasMeasure ? measureOnTimeline : undefined,
    };
};

const span = (start: number | undefined, end: number | undefined): number | undefined =>
    start === undefined || end === undefined ? undefined : end - start;

/**
 * Times one animated transition. A fresh timer per transition: a newer
 * navigation supersedes an older one while both are still settling.
 */
export const createTransitionTimer = (deps: TimerDeps = browserDeps()): TransitionTimer => {
    const { now, requestFrame, cancelFrame, measure } = deps;
    const startedAt = now();
    let callbackAt: number | undefined;
    let updatedAt: number | undefined;
    let readyAt: number | undefined;
    let updateFailed = false;
    let readyFailed = false;

    let frameHandle: number | undefined;
    let frames = 0;
    let maxFrameGap = 0;
    let lastFrameAt = 0;

    const onFrame = (): void => {
        const frameAt = now();
        frames += 1;
        maxFrameGap = Math.max(maxFrameGap, frameAt - lastFrameAt);
        lastFrameAt = frameAt;
        frameHandle = requestFrame?.(onFrame);
    };

    const startCountingFrames = (): void => {
        if (!requestFrame) return;
        lastFrameAt = now();
        frameHandle = requestFrame(onFrame);
    };

    const stopCountingFrames = (): void => {
        if (frameHandle === undefined) return;
        cancelFrame?.(frameHandle);
        frameHandle = undefined;
    };

    const markCallback = (): void => {
        callbackAt = now();
    };

    const track = (vt: ViewTransition): void => {
        vt.updateCallbackDone.then(
            () => {
                updatedAt = now();
            },
            () => {
                updateFailed = true;
            }
        );
        vt.ready.then(
            () => {
                readyAt = now();
                startCountingFrames();
            },
            () => {
                readyFailed = true;
            }
        );
    };

    const finish = (skipped: boolean): TransitionTiming => {
        stopCountingFrames();
        const finishedAt = now();
        const outcome = updateFailed ? 'error' : skipped || readyFailed ? 'skipped' : 'finished';
        const animationRan = outcome === 'finished';
        const animationEnd = animationRan ? finishedAt : undefined;
        const countedFrames = animationRan && requestFrame !== undefined;

        if (measure) {
            const phases = [
                ['pt:capture', startedAt, callbackAt],
                ['pt:update', callbackAt, updatedAt],
                ['pt:start', updatedAt, readyAt],
                ['pt:animation', readyAt, animationEnd],
            ] as const;
            phases.forEach(([name, start, end]) => {
                if (start !== undefined && end !== undefined) measure(name, start, end);
            });
        }

        return {
            outcome,
            capture: span(startedAt, callbackAt),
            update: span(callbackAt, updatedAt),
            start: span(updatedAt, readyAt),
            animation: span(readyAt, animationEnd),
            frames: countedFrames ? frames : undefined,
            maxFrameGap: countedFrames ? maxFrameGap : undefined,
        };
    };

    return { markCallback, track, finish };
};
