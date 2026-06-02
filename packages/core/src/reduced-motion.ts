/**
 * Detects whether the user has requested reduced motion via OS-level
 * accessibility settings. Safe to call from SSR and from environments
 * without `matchMedia`. Some hybrid WebViews throw when matchMedia is
 * called against an opaque origin — that throw is caught here so the
 * navigation never rejects because the OS preference couldn't be
 * read.
 */
export const isReducedMotion = (): boolean => {
    if (typeof window === 'undefined') return false;
    if (typeof window.matchMedia !== 'function') return false;
    try {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
        return false;
    }
};
