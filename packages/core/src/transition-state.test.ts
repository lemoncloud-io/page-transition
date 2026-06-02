import { describe, it, expect, beforeEach, vi } from 'vitest';

import {
    claimTransition,
    getCurrentEntry,
    releaseTransition,
    __resetTransitionState,
} from './transition-state';

import type { ViewTransition } from './types';

const createFakeViewTransition = (): ViewTransition & { skipTransition: ReturnType<typeof vi.fn> } => ({
    finished: Promise.resolve(),
    ready: Promise.resolve(),
    updateCallbackDone: Promise.resolve(),
    skipTransition: vi.fn(),
});

describe('transition-state', () => {
    beforeEach(() => {
        __resetTransitionState();
    });

    it('returns undefined when no transition active', () => {
        expect(getCurrentEntry()?.vt).toBeUndefined();
    });

    it('tracks current transition after claim', () => {
        const vt = createFakeViewTransition();
        claimTransition({ vt });

        expect(getCurrentEntry()?.vt).toBe(vt);
    });

    it('returns previous entry when a new claim arrives', () => {
        const first = createFakeViewTransition();
        const second = createFakeViewTransition();
        const firstOnSkipped = vi.fn();

        const previous = claimTransition({ vt: first, onSkipped: firstOnSkipped });
        expect(previous).toBeUndefined();

        const supersededBy = claimTransition({ vt: second });
        expect(supersededBy?.vt).toBe(first);
        expect(supersededBy?.onSkipped).toBe(firstOnSkipped);

        expect(getCurrentEntry()?.vt).toBe(second);
    });

    it('release clears current when vt matches', () => {
        const vt = createFakeViewTransition();
        claimTransition({ vt });
        releaseTransition(vt);

        expect(getCurrentEntry()?.vt).toBeUndefined();
    });

    it('release is no-op for a stale (superseded) vt', () => {
        const first = createFakeViewTransition();
        const second = createFakeViewTransition();

        claimTransition({ vt: first });
        claimTransition({ vt: second });
        releaseTransition(first);

        expect(getCurrentEntry()?.vt).toBe(second);
    });
});
