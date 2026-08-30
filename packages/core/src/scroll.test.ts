import { describe, it, expect, beforeEach, vi } from 'vitest';

import {
    pushScrollPosition,
    popScrollPosition,
    clearScrollStack,
    readScrollPosition,
    applyScrollPosition,
    saveScrollPosition,
    peekScrollPosition,
    discardScrollPosition,
    __defaultScrollStoreForTest,
} from './scroll';

const makeContainer = (scrollLeft: number, scrollTop: number): Element => {
    const el = document.createElement('div');
    Object.defineProperty(el, 'scrollLeft', { configurable: true, value: scrollLeft });
    Object.defineProperty(el, 'scrollTop', { configurable: true, value: scrollTop });
    el.scrollTo = vi.fn();
    return el;
};

describe('scroll store (location-key)', () => {
    beforeEach(() => {
        clearScrollStack();
        window.scrollTo(0, 0);
        // Reset history state so each test gets a fresh key namespace.
        window.history.replaceState({ key: 'key-a' }, '', '/test-a');
    });

    it('saves and restores scroll position for the same key', () => {
        Object.defineProperty(window, 'scrollX', { configurable: true, value: 10 });
        Object.defineProperty(window, 'scrollY', { configurable: true, value: 120 });

        pushScrollPosition();

        const restored = popScrollPosition();
        expect(restored).toEqual({ x: 10, y: 120 });
    });

    it('returns undefined when no entry for current key', () => {
        expect(popScrollPosition()).toBeUndefined();
    });

    it('keeps entries scoped per location-key', () => {
        Object.defineProperty(window, 'scrollX', { configurable: true, value: 0 });
        Object.defineProperty(window, 'scrollY', { configurable: true, value: 50 });
        pushScrollPosition();

        window.history.replaceState({ key: 'key-b' }, '', '/test-b');
        Object.defineProperty(window, 'scrollY', { configurable: true, value: 999 });
        pushScrollPosition();

        // Pop key-b first.
        expect(popScrollPosition()).toEqual({ x: 0, y: 999 });

        window.history.replaceState({ key: 'key-a' }, '', '/test-a');
        expect(popScrollPosition()).toEqual({ x: 0, y: 50 });
    });

    it('evicts oldest entries past maxEntries', () => {
        const store = __defaultScrollStoreForTest;
        Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });

        for (let i = 0; i < 60; i++) {
            window.history.replaceState({ key: `k-${i}` }, '', `/p-${i}`);
            pushScrollPosition();
        }

        expect(store.size()).toBeLessThanOrEqual(50);
    });

    it('clearScrollStack empties the store', () => {
        pushScrollPosition();
        clearScrollStack();

        expect(popScrollPosition()).toBeUndefined();
    });

    it('SSR — popScrollPosition returns undefined without window', () => {
        const original = global.window;
        vi.stubGlobal('window', undefined);

        expect(popScrollPosition()).toBeUndefined();

        vi.stubGlobal('window', original);
    });
});

describe('scroll root (container scrolling)', () => {
    beforeEach(() => {
        clearScrollStack();
        window.history.replaceState({ key: 'root-key' }, '', '/root');
    });

    it('readScrollPosition reads from the container when given a root', () => {
        const el = makeContainer(7, 240);
        expect(readScrollPosition(el)).toEqual({ x: 7, y: 240 });
    });

    it('readScrollPosition falls back to the window without a root', () => {
        Object.defineProperty(window, 'scrollX', { configurable: true, value: 3 });
        Object.defineProperty(window, 'scrollY', { configurable: true, value: 42 });
        expect(readScrollPosition()).toEqual({ x: 3, y: 42 });
    });

    it('applyScrollPosition scrolls the container when given a root', () => {
        const el = makeContainer(0, 0);
        applyScrollPosition({ x: 0, y: 180 }, el);
        expect(el.scrollTo).toHaveBeenCalledWith(0, 180);
    });

    it('pushScrollPosition saves the container offset and pops it back', () => {
        const el = makeContainer(0, 360);
        pushScrollPosition(el);
        expect(popScrollPosition()).toEqual({ x: 0, y: 360 });
    });
});

/** Moves the document to a new history entry, as a router would. */
const enterEntry = (state: unknown, path: string): void => {
    window.history.replaceState(state, '', path);
};

describe.each([
    ['react-router', (n: number) => ({ key: `k${n}`, idx: n })],
    ['vue-router', (n: number) => ({ current: `/p${n}`, position: n })],
])('ordinal lookup — %s', (_routerName, stateAt) => {
    beforeEach(() => {
        clearScrollStack();
        enterEntry(stateAt(0), '/p0');
    });

    it('restores the destination entry when the key has already moved on', () => {
        saveScrollPosition(makeContainer(0, 700));

        enterEntry(stateAt(1), '/p1');

        expect(peekScrollPosition(-1)).toEqual({ x: 0, y: 700 });
    });

    it('resolves two hops back', () => {
        saveScrollPosition(makeContainer(0, 120));

        enterEntry(stateAt(1), '/p1');
        saveScrollPosition(makeContainer(0, 340));

        enterEntry(stateAt(2), '/p2');

        expect(peekScrollPosition(-1)).toEqual({ x: 0, y: 340 });
        expect(peekScrollPosition(-2)).toEqual({ x: 0, y: 120 });
    });

    it('resolves the current entry for delta 0', () => {
        saveScrollPosition(makeContainer(0, 55));

        expect(peekScrollPosition(0)).toEqual({ x: 0, y: 55 });
    });

    it('does not consume the entry it returns', () => {
        saveScrollPosition(makeContainer(0, 410));
        enterEntry(stateAt(1), '/p1');

        expect(peekScrollPosition(-1)).toEqual({ x: 0, y: 410 });
        expect(peekScrollPosition(-1)).toEqual({ x: 0, y: 410 });
    });

    it('discards exactly the key it was given, even after the entry moved on', () => {
        const savedKey = saveScrollPosition(makeContainer(0, 260));

        // The router committed before the caller rolled back.
        enterEntry(stateAt(1), '/p1');
        discardScrollPosition(savedKey);

        expect(peekScrollPosition(-1)).toBeUndefined();
    });
});

describe('ordinal lookup — no ordinal available', () => {
    beforeEach(() => {
        clearScrollStack();
        window.history.replaceState({ key: 'no-ordinal-a' }, '', '/no-ordinal-a');
    });

    it('returns undefined for a non-zero delta rather than the departing entry', () => {
        saveScrollPosition(makeContainer(0, 880));

        window.history.replaceState({ key: 'no-ordinal-b' }, '', '/no-ordinal-b');

        expect(peekScrollPosition(-1)).toBeUndefined();
    });

    it('still resolves the current entry for delta 0', () => {
        saveScrollPosition(makeContainer(0, 880));

        expect(peekScrollPosition(0)).toEqual({ x: 0, y: 880 });
    });
});

describe('ordinal eviction', () => {
    beforeEach(() => {
        clearScrollStack();
    });

    it('drops the ordinal mapping of an evicted key instead of resurrecting it', () => {
        const store = __defaultScrollStoreForTest;

        for (let i = 0; i < 60; i++) {
            window.history.replaceState({ key: `evict-${i}`, idx: i }, '', `/evict-${i}`);
            saveScrollPosition(makeContainer(0, i));
        }

        expect(store.size()).toBeLessThanOrEqual(50);

        // Entry 0 was evicted long ago; asking for it must not resurrect a position.
        window.history.replaceState({ key: 'evict-1', idx: 1 }, '', '/evict-1');
        expect(peekScrollPosition(-1)).toBeUndefined();
    });
});

describe('deprecated store API stays frozen', () => {
    beforeEach(() => {
        clearScrollStack();
        window.history.replaceState({ key: 'frozen', idx: 4 }, '', '/frozen');
    });

    it('popScrollPosition still reads the current entry and still consumes it', () => {
        pushScrollPosition(makeContainer(0, 310));

        expect(popScrollPosition()).toEqual({ x: 0, y: 310 });
        expect(popScrollPosition()).toBeUndefined();
    });
});
