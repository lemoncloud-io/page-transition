import { renderHook, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ANDROID_PLATFORM_CLASS, BACK_NAVIGATION_CLASS } from '../constants';

import { useNavigateWithTransition } from './useNavigateWithTransition';

import type { ReactNode } from 'react';

const wrapper = ({ children }: { children: ReactNode }) => <MemoryRouter>{children}</MemoryRouter>;

describe('useNavigateWithTransition', () => {
    beforeEach(() => {
        document.documentElement.classList.remove(BACK_NAVIGATION_CLASS);
        document.documentElement.classList.remove(ANDROID_PLATFORM_CLASS);
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
});
