import type { ReactElement } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ViewTransition, ViewTransitionCallback } from '@lemoncloud/page-transition-core';

import { useGoBack } from './useGoBack';
import { useNavigateWithTransition } from './useNavigateWithTransition';

/**
 * Regression guard for history hops on a real (browser) history.
 *
 * `history.go(-1)` only queues the traversal — `popstate` reaches the
 * router in a later task. The View Transitions callback used to resolve
 * after a single microtask, so the "new" snapshot was taken of the page
 * being left and the restored scroll offset was applied to the wrong DOM.
 * `MemoryRouter` hides this because its `go()` is synchronous.
 *
 * The check: when the callback handed to `startViewTransition` settles,
 * the destination page is already in the document.
 */

const LOCATION_COMMIT_TIMEOUT_MS = 500;

const Home = (): ReactElement => {
    const navigate = useNavigateWithTransition();
    const goBack = useGoBack();
    return (
        <>
            <button type="button" data-testid="home" onClick={() => navigate('/detail')}>
                open
            </button>
            <button type="button" data-testid="home-back" onClick={() => goBack()}>
                back
            </button>
            <button type="button" data-testid="home-forward" onClick={() => navigate(1)}>
                forward
            </button>
        </>
    );
};

const Detail = (): ReactElement => {
    const goBack = useGoBack();
    return (
        <button type="button" data-testid="detail" onClick={() => goBack()}>
            back
        </button>
    );
};

const App = (): ReactElement => (
    <BrowserRouter>
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/detail" element={<Detail />} />
        </Routes>
    </BrowserRouter>
);

const currentPage = (): string => (screen.queryByTestId('home') ? 'home' : 'detail');

describe('history hop commit', () => {
    const original = document.startViewTransition;
    let pageAtCallbackEnd: string[] = [];

    beforeEach(() => {
        pageAtCallbackEnd = [];
        window.history.replaceState(null, '', '/');
        document.startViewTransition = (callback: ViewTransitionCallback): ViewTransition => {
            const updateCallbackDone = Promise.resolve(callback()).then(() => {
                pageAtCallbackEnd.push(currentPage());
            });
            return {
                finished: updateCallbackDone,
                ready: updateCallbackDone,
                updateCallbackDone,
                skipTransition: vi.fn(),
            };
        };
    });

    afterEach(() => {
        vi.useRealTimers();
        document.startViewTransition = original;
    });

    const openDetail = async (): Promise<void> => {
        act(() => {
            screen.getByTestId('home').click();
        });
        await waitFor(() => expect(screen.getByTestId('detail')).toBeInTheDocument());
    };

    it('holds the transition callback open until the previous page has committed', async () => {
        render(<App />);
        await openDetail();

        // Back unmounts <Detail>, the component that owns the waiting
        // hook — the unmount cleanup is what releases the waiter.
        act(() => {
            screen.getByTestId('detail').click();
        });
        await waitFor(() => expect(pageAtCallbackEnd).toHaveLength(2));

        expect(pageAtCallbackEnd).toEqual(['detail', 'home']);
    });

    it('holds the callback open for a forward hop too', async () => {
        render(<App />);
        await openDetail();

        act(() => {
            screen.getByTestId('detail').click();
        });
        await waitFor(() => expect(screen.getByTestId('home')).toBeInTheDocument());

        act(() => {
            screen.getByTestId('home-forward').click();
        });
        await waitFor(() => expect(pageAtCallbackEnd).toHaveLength(3));

        expect(pageAtCallbackEnd[2]).toBe('detail');
    });

    describe('when the location never changes', () => {
        beforeEach(() => {
            vi.useFakeTimers();
            // jsdom keeps one history stack for the whole file, so a
            // real `go(-1)` here would land on an entry pushed by an
            // earlier test. Past the end of the stack a browser does
            // nothing — no `popstate`, no commit — which is the case
            // under test.
            vi.spyOn(window.history, 'go').mockImplementation(() => undefined);
        });

        afterEach(() => {
            vi.restoreAllMocks();
        });

        it('settles the callback after the timeout when back has nowhere to go', async () => {
            render(<App />);

            act(() => {
                screen.getByTestId('home-back').click();
            });
            await vi.advanceTimersByTimeAsync(LOCATION_COMMIT_TIMEOUT_MS - 1);
            expect(pageAtCallbackEnd).toHaveLength(0);

            await vi.advanceTimersByTimeAsync(1);
            expect(pageAtCallbackEnd).toEqual(['home']);
        });

        it('releases the earlier waiter when a second back starts before it commits', async () => {
            render(<App />);

            act(() => {
                screen.getByTestId('home-back').click();
            });
            act(() => {
                screen.getByTestId('home-back').click();
            });
            // No timer has fired — the first callback settled because
            // the second hop released it, not because it timed out.
            await vi.advanceTimersByTimeAsync(0);
            expect(pageAtCallbackEnd).toEqual(['home']);

            await vi.advanceTimersByTimeAsync(LOCATION_COMMIT_TIMEOUT_MS);
            expect(pageAtCallbackEnd).toEqual(['home', 'home']);
        });

        it('still settles by timeout when the signal aborts mid-wait', async () => {
            const controller = new AbortController();
            const onSkipped = vi.fn();
            let navigation: Promise<void> | undefined;

            const Aborting = (): ReactElement => {
                const goBack = useGoBack();
                return (
                    <button
                        type="button"
                        data-testid="aborting"
                        onClick={() => {
                            navigation = goBack({ signal: controller.signal, onSkipped });
                        }}
                    >
                        back
                    </button>
                );
            };
            render(
                <BrowserRouter>
                    <Aborting />
                </BrowserRouter>
            );

            act(() => {
                screen.getByTestId('aborting').click();
            });
            controller.abort();
            await vi.advanceTimersByTimeAsync(0);
            expect(onSkipped).toHaveBeenCalledWith('aborted');
            expect(pageAtCallbackEnd).toHaveLength(0);

            await vi.advanceTimersByTimeAsync(LOCATION_COMMIT_TIMEOUT_MS);
            expect(pageAtCallbackEnd).toHaveLength(1);
            await expect(navigation).resolves.toBeUndefined();
        });
    });
});
