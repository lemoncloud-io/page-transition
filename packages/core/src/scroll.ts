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
    save: (pos: ScrollPosition) => void;
    restore: () => ScrollPosition | undefined;
    clear: () => void;
    size: () => number;
}

/** Reads the current scroll offset from a container element, or the window. */
export const readScrollPosition = (root?: Element | null): ScrollPosition =>
    root ? { x: root.scrollLeft, y: root.scrollTop } : { x: window.scrollX, y: window.scrollY };

/** Applies a scroll offset to a container element, or the window. */
export const applyScrollPosition = (pos: ScrollPosition, root?: Element | null): void => {
    if (typeof window === 'undefined') return;
    if (root) {
        root.scrollTo(pos.x, pos.y);
    } else {
        window.scrollTo(pos.x, pos.y);
    }
};

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
        save: (pos: ScrollPosition): void => {
            const key = currentKey();
            // Re-insert to mark as most recent for LRU eviction.
            positions.delete(key);
            positions.set(key, pos);
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
 * Saves the current scroll offset for the active history entry. Reads
 * from `root` when provided (a scroll container), otherwise the window.
 *
 * @deprecated Use `TransitionOptions.scrollRoot` and let the lib manage
 * scroll restoration. Direct calls remain functional but the global
 * default store will be removed in v2.0.
 */
export const pushScrollPosition = (root?: Element | null): void => {
    if (typeof window === 'undefined') return;
    defaultStore.save(readScrollPosition(root));
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
