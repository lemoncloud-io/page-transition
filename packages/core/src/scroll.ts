/**
 * Scroll position store keyed by history entry.
 *
 * Previous versions used a global LIFO stack which desynced when the
 * caller used `replace: true`, navigated via `history.go(n)`, or
 * opened the page in multiple roots.
 *
 * An entry's key is its **ordinal** where the router exposes one —
 * `history.state.idx` (react-router) or `history.state.position`
 * (vue-router). Both number the history stack, increment by exactly one
 * per push, and survive a replace, so the ordinal identifies the entry
 * *and* its neighbours: the entry `n` steps back is simply `ordinal + n`.
 * That matters because `history.go(-n)` is asynchronous — while the
 * transition callback runs, the state still describes the entry being
 * *left*, so a back navigation cannot find its destination by reading a
 * key. Arithmetic on the departing ordinal can.
 *
 * Without an ordinal the key falls back to `history.state.key`, then to
 * the URL plus `history.length`. Neither can name a *neighbouring* entry,
 * so a non-zero delta resolves to nothing rather than returning the
 * departing entry's own offset and restoring a stale position onto the
 * new page.
 *
 * The public functions (`pushScrollPosition`, `popScrollPosition`,
 * `clearScrollStack`) keep their original signatures and are now
 * marked `@deprecated`. They delegate to the default store. Removal
 * is planned for v2.0 — consumers should pass `TransitionOptions.scrollRoot`
 * and let the library manage restoration instead.
 */

export interface ScrollPosition {
    x: number;
    y: number;
}

const DEFAULT_MAX_ENTRIES = 50;

interface ScrollStore {
    save: (pos: ScrollPosition) => string;
    restore: (delta: number, options: { consume: boolean }) => ScrollPosition | undefined;
    discard: (key: string) => void;
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

interface HistoryEntryState {
    key?: unknown;
    idx?: unknown;
    position?: unknown;
}

/** Position of the entry within the history stack, when the router publishes one. */
const readOrdinal = (state: HistoryEntryState | null): number | null => {
    if (typeof state?.idx === 'number') return state.idx;
    if (typeof state?.position === 'number') return state.position;
    return null;
};

const ordinalKey = (ordinal: number): string => `ord:${ordinal}`;

/** Identity of the entry the document is currently on — see the file header. */
const readEntryIdentity = (): { key: string; ordinal: number | null } => {
    if (typeof window === 'undefined') return { key: '__ssr__', ordinal: null };
    const state = window.history.state as HistoryEntryState | null;

    const ordinal = readOrdinal(state);
    if (ordinal !== null) return { key: ordinalKey(ordinal), ordinal };
    if (typeof state?.key === 'string') return { key: state.key, ordinal: null };
    return { key: `${window.location.href}#${window.history.length}`, ordinal: null };
};

const createScrollStore = (maxEntries: number = DEFAULT_MAX_ENTRIES): ScrollStore => {
    const entries = new Map<string, ScrollPosition>();

    const evictIfFull = (): void => {
        if (entries.size <= maxEntries) return;
        const oldestKey = entries.keys().next().value;
        if (oldestKey !== undefined) entries.delete(oldestKey);
    };

    // A non-zero delta names a *neighbouring* entry, which only the
    // ordinal can address — see the file header.
    const resolveKey = (delta: number): string | undefined => {
        const { key, ordinal } = readEntryIdentity();
        if (delta === 0) return key;
        if (ordinal === null) return undefined;
        return ordinalKey(ordinal + delta);
    };

    return {
        save: (pos: ScrollPosition): string => {
            const { key } = readEntryIdentity();
            // Re-insert to mark as most recent for LRU eviction.
            entries.delete(key);
            entries.set(key, pos);
            evictIfFull();
            return key;
        },
        restore: (delta: number, { consume }: { consume: boolean }): ScrollPosition | undefined => {
            if (typeof window === 'undefined') return undefined;
            const key = resolveKey(delta);
            if (key === undefined) return undefined;
            const pos = entries.get(key);
            if (pos && consume) entries.delete(key);
            return pos;
        },
        discard: (key: string): void => {
            entries.delete(key);
        },
        clear: (): void => {
            entries.clear();
        },
        size: (): number => entries.size,
    };
};

const defaultStore = createScrollStore();

/**
 * Internal — saves the current scroll offset for the active history
 * entry and returns the key it was stored under, so a caller that has
 * to roll back can name the exact record it wrote. Not part of the
 * package's public API.
 */
export const saveScrollPosition = (root?: Element | null): string | undefined => {
    if (typeof window === 'undefined') return undefined;
    return defaultStore.save(readScrollPosition(root));
};

/**
 * Internal — reads the offset saved for the entry `delta` hops from the
 * active one (`-1` = one step back, `0` = the active entry) without
 * consuming it, so the position survives a browser-driven forward/back
 * cycle the way native scroll restoration does. Not part of the
 * package's public API.
 */
export const peekScrollPosition = (delta: number): ScrollPosition | undefined =>
    defaultStore.restore(delta, { consume: false });

/**
 * Internal — removes one stored record by key. Used to undo a `save()`
 * when the navigation it was saved for failed. Not part of the
 * package's public API.
 */
export const discardScrollPosition = (key: string | undefined): void => {
    if (key === undefined) return;
    defaultStore.discard(key);
};

/**
 * Saves the current scroll offset for the active history entry. Reads
 * from `root` when provided (a scroll container), otherwise the window.
 *
 * @deprecated Use `TransitionOptions.scrollRoot` and let the lib manage
 * scroll restoration. Direct calls remain functional but the global
 * default store will be removed in v2.0.
 */
export const pushScrollPosition = (root?: Element | null): void => {
    saveScrollPosition(root);
};

/**
 * Reads and removes the offset saved for the active history entry.
 *
 * @deprecated See `pushScrollPosition`. Removed in v2.0.
 */
export const popScrollPosition = (): ScrollPosition | undefined => {
    return defaultStore.restore(0, { consume: true });
};

/**
 * @deprecated See `pushScrollPosition`. Removed in v2.0.
 */
export const clearScrollStack = (): void => {
    defaultStore.clear();
};

/** Internal — the default store, exposed so tests can assert on its size. */
export const __defaultScrollStoreForTest: ScrollStore = defaultStore;
