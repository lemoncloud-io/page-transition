import { renderHook, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
    ANDROID_PLATFORM_CLASS,
    BACK_NAVIGATION_CLASS,
} from '../constants';

import { useGoBack } from './useGoBack';

import type { ReactNode } from 'react';

const wrapper = ({ children }: { children: ReactNode }) => <MemoryRouter>{children}</MemoryRouter>;

describe('useGoBack', () => {
    beforeEach(() => {
        document.documentElement.classList.remove(BACK_NAVIGATION_CLASS);
        document.documentElement.classList.remove(ANDROID_PLATFORM_CLASS);
        vi.clearAllMocks();
    });

    it('should return a function', () => {
        const { result } = renderHook(() => useGoBack(), { wrapper });
        expect(typeof result.current).toBe('function');
    });

    it('should call startViewTransition when invoked', () => {
        const { result } = renderHook(() => useGoBack(), { wrapper });

        act(() => {
            result.current();
        });

        expect(document.startViewTransition).toHaveBeenCalled();
    });

    it('should add back-navigation class', () => {
        const { result } = renderHook(() => useGoBack(), { wrapper });

        act(() => {
            result.current();
        });

        expect(document.documentElement.classList.contains(BACK_NAVIGATION_CLASS)).toBe(true);
    });

    it('should add android class when platform is android', () => {
        const { result } = renderHook(() => useGoBack({ platform: 'android' }), { wrapper });

        act(() => {
            result.current();
        });

        expect(document.documentElement.classList.contains(ANDROID_PLATFORM_CLASS)).toBe(true);
        expect(document.documentElement.classList.contains(BACK_NAVIGATION_CLASS)).toBe(true);
    });

    it('should not add android class when platform is ios', () => {
        const { result } = renderHook(() => useGoBack({ platform: 'ios' }), { wrapper });

        act(() => {
            result.current();
        });

        expect(document.documentElement.classList.contains(ANDROID_PLATFORM_CLASS)).toBe(false);
        expect(document.documentElement.classList.contains(BACK_NAVIGATION_CLASS)).toBe(true);
    });

    it('should return a Promise', () => {
        const { result } = renderHook(() => useGoBack(), { wrapper });

        let returnValue: Promise<void> | undefined;
        act(() => {
            returnValue = result.current();
        });

        expect(returnValue).toBeInstanceOf(Promise);
    });

    it('should resolve Promise when transition completes', async () => {
        const { result } = renderHook(() => useGoBack(), { wrapper });

        let returnValue: Promise<void> | undefined;
        act(() => {
            returnValue = result.current();
        });

        await expect(returnValue).resolves.toBeUndefined();
    });

    it('should return stable function reference', () => {
        const { result, rerender } = renderHook(
            ({ platform }) => useGoBack({ platform }),
            { wrapper, initialProps: { platform: 'ios' as const } }
        );

        const firstGoBack = result.current;

        // Rerender with same platform
        rerender({ platform: 'ios' as const });

        const secondGoBack = result.current;

        expect(firstGoBack).toBe(secondGoBack);
    });

    it('should update function when platform changes', () => {
        const { result, rerender } = renderHook(
            ({ platform }) => useGoBack({ platform }),
            { wrapper, initialProps: { platform: 'ios' as const } }
        );

        const firstGoBack = result.current;

        // Rerender with different platform
        rerender({ platform: 'android' as const });

        const secondGoBack = result.current;

        expect(firstGoBack).not.toBe(secondGoBack);
    });
});
