import { describe, it, expect, vi, afterEach } from 'vitest';

import { isReducedMotion } from './reduced-motion';

describe('isReducedMotion', () => {
    const originalWindow = global.window;
    const originalMatchMedia = global.window?.matchMedia;

    afterEach(() => {
        if (originalMatchMedia) {
            global.window.matchMedia = originalMatchMedia;
        }
        vi.stubGlobal('window', originalWindow);
    });

    it('returns true when matchMedia matches reduce', () => {
        global.window.matchMedia = vi.fn().mockReturnValue({ matches: true });

        expect(isReducedMotion()).toBe(true);
    });

    it('returns false when matchMedia does not match', () => {
        global.window.matchMedia = vi.fn().mockReturnValue({ matches: false });

        expect(isReducedMotion()).toBe(false);
    });

    it('returns false when matchMedia is undefined', () => {
        global.window.matchMedia = undefined as unknown as typeof window.matchMedia;

        expect(isReducedMotion()).toBe(false);
    });

    it('returns false in SSR (no window)', () => {
        vi.stubGlobal('window', undefined);

        expect(isReducedMotion()).toBe(false);
    });
});
