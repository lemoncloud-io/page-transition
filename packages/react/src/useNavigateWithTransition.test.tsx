import { renderHook, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
    ANDROID_PLATFORM_CLASS,
    ANIMATION_FADE_CLASS,
    ANIMATION_LIFT_CLASS,
    ANIMATION_SLIDE_CLASS,
    ANIMATION_ZOOM_CLASS,
    BACK_NAVIGATION_CLASS,
} from '@lemoncloud/page-transition-core';

import { useNavigateWithTransition } from './useNavigateWithTransition';

import type { ReactNode } from 'react';

const wrapper = ({ children }: { children: ReactNode }) => <MemoryRouter>{children}</MemoryRouter>;

describe('useNavigateWithTransition', () => {
    beforeEach(() => {
        // Clean up all animation classes
        [
            BACK_NAVIGATION_CLASS,
            ANDROID_PLATFORM_CLASS,
            ANIMATION_FADE_CLASS,
            ANIMATION_ZOOM_CLASS,
            ANIMATION_LIFT_CLASS,
            ANIMATION_SLIDE_CLASS,
        ].forEach(cls => document.documentElement.classList.remove(cls));
        vi.clearAllMocks();
    });

    it('should return a navigate function', () => {
        const { result } = renderHook(() => useNavigateWithTransition(), { wrapper });
        expect(typeof result.current).toBe('function');
    });

    it('should call startViewTransition for path navigation', () => {
        const { result } = renderHook(() => useNavigateWithTransition(), { wrapper });

        act(() => {
            result.current('/test-path');
        });

        expect(document.startViewTransition).toHaveBeenCalled();
    });

    it('should add back-navigation class for negative navigation', () => {
        const { result } = renderHook(() => useNavigateWithTransition(), { wrapper });

        act(() => {
            result.current(-1);
        });

        expect(document.documentElement.classList.contains(BACK_NAVIGATION_CLASS)).toBe(true);
    });

    it('should not add back-navigation class for positive navigation', () => {
        const { result } = renderHook(() => useNavigateWithTransition(), { wrapper });

        act(() => {
            result.current(1);
        });

        expect(document.documentElement.classList.contains(BACK_NAVIGATION_CLASS)).toBe(false);
    });

    it('should skip transition when transition option is false', () => {
        const { result } = renderHook(() => useNavigateWithTransition(), { wrapper });

        act(() => {
            result.current('/test', { transition: false });
        });

        expect(document.startViewTransition).not.toHaveBeenCalled();
    });

    it('should add android class when platform is android', () => {
        const { result } = renderHook(() => useNavigateWithTransition({ platform: 'android' }), { wrapper });

        act(() => {
            result.current('/test');
        });

        expect(document.documentElement.classList.contains(ANDROID_PLATFORM_CLASS)).toBe(true);
    });

    it('should not add android class when platform is ios', () => {
        const { result } = renderHook(() => useNavigateWithTransition({ platform: 'ios' }), { wrapper });

        act(() => {
            result.current('/test');
        });

        expect(document.documentElement.classList.contains(ANDROID_PLATFORM_CLASS)).toBe(false);
    });

    it('should use custom detectPlatform function', () => {
        const detectPlatform = vi.fn(() => 'android' as const);
        const { result } = renderHook(() => useNavigateWithTransition({ detectPlatform }), { wrapper });

        act(() => {
            result.current('/test');
        });

        expect(detectPlatform).toHaveBeenCalled();
        expect(document.documentElement.classList.contains(ANDROID_PLATFORM_CLASS)).toBe(true);
    });

    // Tests for direction option
    describe('direction option', () => {
        it('should add back-navigation class when direction is "back" for path navigation', () => {
            const { result } = renderHook(() => useNavigateWithTransition(), { wrapper });

            act(() => {
                result.current('/home', { direction: 'back' });
            });

            expect(document.documentElement.classList.contains(BACK_NAVIGATION_CLASS)).toBe(true);
        });

        it('should not add back-navigation class when direction is "forward"', () => {
            const { result } = renderHook(() => useNavigateWithTransition(), { wrapper });

            act(() => {
                result.current('/settings', { direction: 'forward' });
            });

            expect(document.documentElement.classList.contains(BACK_NAVIGATION_CLASS)).toBe(false);
        });

        it('should use explicit direction over numeric navigation', () => {
            const { result } = renderHook(() => useNavigateWithTransition(), { wrapper });

            // Explicit direction: 'forward' overrides -1 numeric back detection
            act(() => {
                result.current(-1, { direction: 'forward' });
            });

            expect(document.documentElement.classList.contains(BACK_NAVIGATION_CLASS)).toBe(false);
        });

        it('should use explicit direction: back with positive number', () => {
            const { result } = renderHook(() => useNavigateWithTransition(), { wrapper });

            // Explicit direction: 'back' overrides +1 numeric forward detection
            act(() => {
                result.current(1, { direction: 'back' });
            });

            expect(document.documentElement.classList.contains(BACK_NAVIGATION_CLASS)).toBe(true);
        });
    });

    // Tests for animation option
    describe('animation option', () => {
        it('should add fade class when animation is "fade"', () => {
            const { result } = renderHook(() => useNavigateWithTransition(), { wrapper });

            act(() => {
                result.current('/modal', { animation: 'fade' });
            });

            expect(document.documentElement.classList.contains(ANIMATION_FADE_CLASS)).toBe(true);
            expect(document.documentElement.classList.contains(ANDROID_PLATFORM_CLASS)).toBe(false);
        });

        it('should add zoom class when animation is "zoom"', () => {
            const { result } = renderHook(() => useNavigateWithTransition(), { wrapper });

            act(() => {
                result.current('/gallery', { animation: 'zoom' });
            });

            expect(document.documentElement.classList.contains(ANIMATION_ZOOM_CLASS)).toBe(true);
        });

        it('should add slide class when animation is "slide"', () => {
            const { result } = renderHook(() => useNavigateWithTransition(), { wrapper });

            act(() => {
                result.current('/page', { animation: 'slide' });
            });

            expect(document.documentElement.classList.contains(ANIMATION_SLIDE_CLASS)).toBe(true);
        });

        it('should add lift class when animation is "lift"', () => {
            const { result } = renderHook(() => useNavigateWithTransition(), { wrapper });

            act(() => {
                result.current('/page', { animation: 'lift' });
            });

            expect(document.documentElement.classList.contains(ANIMATION_LIFT_CLASS)).toBe(true);
        });

        it('should not call startViewTransition when animation is "none"', () => {
            const { result } = renderHook(() => useNavigateWithTransition(), { wrapper });

            act(() => {
                result.current('/instant', { animation: 'none' });
            });

            expect(document.startViewTransition).not.toHaveBeenCalled();
        });

        it('should override platform animation when animation is specified', () => {
            const { result } = renderHook(() => useNavigateWithTransition({ platform: 'android' }), { wrapper });

            act(() => {
                result.current('/modal', { animation: 'fade' });
            });

            // animation: 'fade' should be used instead of android platform animation
            expect(document.documentElement.classList.contains(ANIMATION_FADE_CLASS)).toBe(true);
            expect(document.documentElement.classList.contains(ANDROID_PLATFORM_CLASS)).toBe(false);
        });

        it('should combine animation with direction', () => {
            const { result } = renderHook(() => useNavigateWithTransition(), { wrapper });

            act(() => {
                result.current('/home', { animation: 'fade', direction: 'back' });
            });

            expect(document.documentElement.classList.contains(ANIMATION_FADE_CLASS)).toBe(true);
            expect(document.documentElement.classList.contains(BACK_NAVIGATION_CLASS)).toBe(true);
        });
    });

    // Tests for Promise return
    describe('Promise return', () => {
        it('should return a Promise', () => {
            const { result } = renderHook(() => useNavigateWithTransition(), { wrapper });

            let returnValue: Promise<void> | undefined;
            act(() => {
                returnValue = result.current('/test');
            });

            expect(returnValue).toBeInstanceOf(Promise);
        });

        it('should return resolved Promise when transition is skipped', async () => {
            const { result } = renderHook(() => useNavigateWithTransition(), { wrapper });

            let returnValue: Promise<void> | undefined;
            act(() => {
                returnValue = result.current('/test', { transition: false });
            });

            await expect(returnValue).resolves.toBeUndefined();
        });

        it('should resolve Promise when transition completes', async () => {
            const { result } = renderHook(() => useNavigateWithTransition(), { wrapper });

            let returnValue: Promise<void> | undefined;
            act(() => {
                returnValue = result.current('/test');
            });

            await expect(returnValue).resolves.toBeUndefined();
        });

        it('should return resolved Promise when animation is "none"', async () => {
            const { result } = renderHook(() => useNavigateWithTransition(), { wrapper });

            let returnValue: Promise<void> | undefined;
            act(() => {
                returnValue = result.current('/instant', { animation: 'none' });
            });

            await expect(returnValue).resolves.toBeUndefined();
        });
    });

    // Config stability test
    describe('config stability', () => {
        it('should not cause re-renders when config object reference changes but values are same', () => {
            const { result, rerender } = renderHook(
                ({ platform }) => useNavigateWithTransition({ platform }),
                { wrapper, initialProps: { platform: 'ios' as const } }
            );

            const firstNavigate = result.current;

            // Rerender with same platform value (but new object)
            rerender({ platform: 'ios' as const });

            const secondNavigate = result.current;

            // The navigate function should be the same reference due to useMemo
            expect(firstNavigate).toBe(secondNavigate);
        });

        it('should update when platform actually changes', () => {
            const { result, rerender } = renderHook(
                ({ platform }: { platform: 'ios' | 'android' }) => useNavigateWithTransition({ platform }),
                { wrapper, initialProps: { platform: 'ios' as const } }
            );

            const firstNavigate = result.current;

            // Rerender with different platform
            rerender({ platform: 'android' });

            const secondNavigate = result.current;

            // The navigate function should be different now
            expect(firstNavigate).not.toBe(secondNavigate);
        });
    });
});
