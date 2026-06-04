import { describe, it, expect, beforeEach, vi } from 'vitest';

import {
    pushScrollPosition,
    popScrollPosition,
    clearScrollStack,
    readScrollPosition,
    applyScrollPosition,
    __defaultScrollStoreForTest,
} from './scroll';

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

    const makeContainer = (scrollLeft: number, scrollTop: number) => {
        const el = document.createElement('div');
        Object.defineProperty(el, 'scrollLeft', { configurable: true, value: scrollLeft });
        Object.defineProperty(el, 'scrollTop', { configurable: true, value: scrollTop });
        el.scrollTo = vi.fn();
        return el;
    };

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
