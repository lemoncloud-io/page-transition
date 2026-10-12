import { renderHook, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useNavigateWithTransition } from './useNavigateWithTransition';
import { useGoBack } from './useGoBack';

import type { TransitionOptions } from '@lemoncloud/page-transition-core';
import type { ReactNode } from 'react';

const { recordOptions, recordRouterOptions } = vi.hoisted(() => ({
    recordOptions: vi.fn(),
    recordRouterOptions: vi.fn(),
}));

vi.mock('react-router-dom', async importOriginal => {
    const actual = await importOriginal<typeof import('react-router-dom')>();
    return {
        ...actual,
        useNavigate: () => {
            const navigate = actual.useNavigate();
            return ((to: Parameters<typeof navigate>[0], options?: Parameters<typeof navigate>[1]) => {
                recordRouterOptions(options);
                return navigate(to as never, options); // `to` is a path or a number; the overloads split them
            }) as typeof navigate; // same call shape, only wrapped to observe options
        },
    };
});

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

describe('onTiming forwarding', () => {
    beforeEach(() => {
        recordOptions.mockClear();
        recordRouterOptions.mockClear();
    });

    const lastOnTiming = (): TransitionOptions['onTiming'] => {
        const lastCall = recordOptions.mock.calls.at(-1);
        return (lastCall?.[0] as TransitionOptions | undefined)?.onTiming; // mock.calls is any[]; the spy records TransitionOptions
    };

    it('forwards onTiming to the core on a path navigation', () => {
        const onTiming = vi.fn();
        const { result } = renderHook(() => useNavigateWithTransition(), { wrapper });

        act(() => {
            result.current('/next', { onTiming });
        });

        expect(lastOnTiming()).toBe(onTiming);
    });

    it('keeps onTiming out of the router navigate options', () => {
        const { result } = renderHook(() => useNavigateWithTransition(), { wrapper });

        act(() => {
            result.current('/next', { onTiming: vi.fn(), state: { from: 'test' } });
        });

        return Promise.resolve().then(() => {
            expect(recordRouterOptions).toHaveBeenCalled();
            expect(recordRouterOptions.mock.calls.at(-1)?.[0]).toEqual({ state: { from: 'test' } });
        });
    });

    it('forwards onTiming from goBack', () => {
        const onTiming = vi.fn();
        const { result } = renderHook(() => useGoBack(), { wrapper });

        act(() => {
            result.current({ onTiming });
        });

        expect(lastOnTiming()).toBe(onTiming);
    });
});
