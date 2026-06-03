import type { SkipReason, ViewTransition } from './types';

/**
 * Tracks the in-flight `ViewTransition` so a new navigation can
 * supersede the previous one cleanly. Each tracked entry carries an
 * optional `onSkipped` callback so the *previous* caller (the one
 * being superseded) is notified, not the new one.
 *
 * Late `releaseTransition` calls from a superseded transition are
 * ignored — only the currently registered entry is cleared.
 */

export interface TrackedTransition {
    vt: ViewTransition;
    onSkipped?: (reason: SkipReason) => void;
}

let current: TrackedTransition | undefined;

export const claimTransition = (entry: TrackedTransition): TrackedTransition | undefined => {
    const previous = current;
    current = entry;
    return previous;
};

export const releaseTransition = (vt: ViewTransition): void => {
    if (current?.vt === vt) {
        current = undefined;
    }
};

export const getCurrentEntry = (): TrackedTransition | undefined => current;

/** Test-only reset. Not exported from the package entry. */
export const __resetTransitionState = (): void => {
    current = undefined;
};
