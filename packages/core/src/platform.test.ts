import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { detectPlatform, resolvePlatform } from './platform';

describe('detectPlatform', () => {
    const originalNavigator = global.navigator;

    beforeEach(() => {
        vi.stubGlobal('navigator', {
            userAgent: '',
            platform: '',
            maxTouchPoints: 0,
        });
    });

    afterEach(() => {
        vi.stubGlobal('navigator', originalNavigator);
    });

    it('should return ios for iPhone user agent', () => {
        vi.stubGlobal('navigator', {
            userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
            platform: 'iPhone',
            maxTouchPoints: 5,
        });

        expect(detectPlatform()).toBe('ios');
    });

    it('should return ios for iPad user agent', () => {
        vi.stubGlobal('navigator', {
            userAgent: 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X)',
            platform: 'iPad',
            maxTouchPoints: 5,
        });

        expect(detectPlatform()).toBe('ios');
    });

    it('should return ios for iPad Pro (MacIntel with touch)', () => {
        vi.stubGlobal('navigator', {
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
            platform: 'MacIntel',
            maxTouchPoints: 5,
        });

        expect(detectPlatform()).toBe('ios');
    });

    it('should return android for Android user agent', () => {
        vi.stubGlobal('navigator', {
            userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7)',
            platform: 'Linux armv81',
            maxTouchPoints: 5,
        });

        expect(detectPlatform()).toBe('android');
    });

    it('should return undefined for desktop user agent', () => {
        vi.stubGlobal('navigator', {
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
            platform: 'MacIntel',
            maxTouchPoints: 0,
        });

        expect(detectPlatform()).toBeUndefined();
    });
});

describe('resolvePlatform', () => {
    it('should use custom detectPlatform when provided', () => {
        const customDetector = vi.fn(() => 'android' as const);
        const result = resolvePlatform({ detectPlatform: customDetector });

        expect(customDetector).toHaveBeenCalled();
        expect(result).toBe('android');
    });

    it('should return explicit platform when set', () => {
        expect(resolvePlatform({ platform: 'ios' })).toBe('ios');
        expect(resolvePlatform({ platform: 'android' })).toBe('android');
    });

    it('should prioritize detectPlatform over platform option', () => {
        const result = resolvePlatform({
            platform: 'ios',
            detectPlatform: () => 'android',
        });

        expect(result).toBe('android');
    });
});
