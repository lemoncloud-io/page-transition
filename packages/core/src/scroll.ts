/**
 * Scroll position store keyed by the active history entry.
 *
 * Previous versions used a global LIFO stack which desynced when the
 * caller used `replace: true`, navigated via `history.go(n)`, or
 * opened the page in multiple roots. The new store keys entries by
 * `history.state.key` (react-router / vue-router both populate it)
 * with a fallback derived from the URL.
 *
 * The public functions (`pushScrollPosition`, `popScrollPosition`,
 * `clearScrollStack`) keep their original signatures and are now
 * marked `@deprecated`. They delegate to the default store. Removal
 * is planned for v2.0 — consumers should migrate to passing the
 * scroll behavior they need through the upcoming `TransitionOptions`
 * once it lands.
 */

export interface ScrollPosition {
    x: number;
    y: number;
}

const DEFAULT_MAX_ENTRIES = 50;

interface ScrollStore {
    save: () => void;
    restore: () => ScrollPosition | undefined;
    clear: () => void;
    size: () => number;
}

const currentKey = (): string => {
    if (typeof window === 'undefined') return '__ssr__';
    const state = window.history.state as { key?: unknown; idx?: unknown } | null;
    if (typeof state?.key === 'string') return state.key;
    if (typeof state?.idx === 'number') return `idx:${state.idx}`;
    return `${window.location.href}#${window.history.length}`;
};

const createScrollStore = (maxEntries: number = DEFAULT_MAX_ENTRIES): ScrollStore => {
    const positions = new Map<string, ScrollPosition>();

    const evictIfFull = (): void => {
        if (positions.size <= maxEntries) return;
        const firstKey = positions.keys().next().value;
        if (firstKey !== undefined) positions.delete(firstKey);
    };

    return {
        save: (): void => {
            if (typeof window === 'undefined') return;
            const key = currentKey();
            // Re-insert to mark as most recent for LRU eviction.
            positions.delete(key);
            positions.set(key, { x: window.scrollX, y: window.scrollY });
            evictIfFull();
        },
        restore: (): ScrollPosition | undefined => {
            if (typeof window === 'undefined') return undefined;
            const key = currentKey();
            const pos = positions.get(key);
            if (pos) positions.delete(key);
            return pos;
        },
        clear: (): void => {
            positions.clear();
        },
        size: (): number => positions.size,
    };
};

const defaultStore = createScrollStore();

/**
 * @deprecated Use `TransitionOptions.direction` and let the lib manage
 * scroll restoration. Direct calls remain functional but the global
 * default store will be removed in v2.0.
 */
export const pushScrollPosition = (): void => {
    defaultStore.save();
};

/**
 * @deprecated See `pushScrollPosition`. Removed in v2.0.
 */
export const popScrollPosition = (): ScrollPosition | undefined => {
    return defaultStore.restore();
};

/**
 * @deprecated See `pushScrollPosition`. Removed in v2.0.
 */
export const clearScrollStack = (): void => {
    defaultStore.clear();
};

/** Internal — used by `transition.ts` so the cleanup race on the default store stays contained. */
export const __defaultScrollStoreForTest: ScrollStore = defaultStore;
