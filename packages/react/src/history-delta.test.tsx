import { renderHook, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useNavigateWithTransition } from './useNavigateWithTransition';
import { useGoBack } from './useGoBack';

import type { TransitionOptions } from '@lemoncloud/page-transition-core';
import type { ReactNode } from 'react';

const { recordOptions } = vi.hoisted(() => ({ recordOptions: vi.fn() }));

vi.mock('@lemoncloud/page-transition-core', async importOriginal => {
    const actual = await importOriginal<typeof import('@lemoncloud/page-transition-core')>();
    return {
        ...actual,
        executePageTransition: (navigationFn: () => void | Promise<void>, options?: TransitionOptions) => {
            recordOptions(options);
            return actual.executePageTransition(navigationFn, options);
        },
    };
});

const wrapper = ({ children }: { children: ReactNode }) => <MemoryRouter>{children}</MemoryRouter>;

const lastDelta = (): number | undefined => {
    const lastCall = recordOptions.mock.calls.at(-1);
    return (lastCall?.[0] as TransitionOptions | undefined)?.delta;
};

describe('history delta forwarding', () => {
    beforeEach(() => {
        recordOptions.mockClear();
    });

    it('forwards -1 for a single step back', () => {
        const { result } = renderHook(() => useNavigateWithTransition(), { wrapper });

        act(() => {
            result.current(-1);
        });

        expect(lastDelta()).toBe(-1);
    });

    it('forwards the full hop count for a multi-entry back', () => {
        const { result } = renderHook(() => useNavigateWithTransition(), { wrapper });

        act(() => {
            result.current(-2);
        });

        expect(lastDelta()).toBe(-2);
    });

    it('forwards 0 for a push that only animates as back', () => {
        const { result } = renderHook(() => useNavigateWithTransition(), { wrapper });

        act(() => {
            result.current('/home', { direction: 'back' });
        });

        // A path navigation pushes a new entry — there is no earlier entry
        // to restore, so the ordinal lookup must stay on the current one.
        expect(lastDelta()).toBe(0);
    });

    it('forwards 0 for a forward hop that only animates as back', () => {
        const { result } = renderHook(() => useNavigateWithTransition(), { wrapper });

        act(() => {
            result.current(1, { direction: 'back' });
        });

        // Restoring `ordinal + 1` would apply the offset of a page ahead of
        // this one — a stale forward position on a back-animated navigation.
        expect(lastDelta()).toBe(0);
    });

    it('lets the caller override the delta explicitly', () => {
        const { result } = renderHook(() => useGoBack(), { wrapper });

        act(() => {
            result.current({ delta: -3 });
        });

        expect(lastDelta()).toBe(-3);
    });
});
