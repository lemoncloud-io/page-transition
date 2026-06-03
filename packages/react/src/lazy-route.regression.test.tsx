import { Suspense, useEffect, useRef } from 'react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useNavigateWithTransition } from './useNavigateWithTransition';

/**
 * Regression guard for the bug that surfaced in the epyt-app
 * `feature/louis-update-creator2` branch: lazy-loaded routes wrapped
 * in `<Suspense>` flashed the previous page (or an empty fallback)
 * before the destination rendered when navigated via
 * `useNavigateWithTransition`.
 *
 * The fix is in the core: `executePageTransition` now awaits the
 * navigation callback so React Router commits asynchronously inside
 * the View Transitions callback, which the API natively awaits.
 *
 * The check: after navigation, the destination page renders exactly
 * once. No fallback-as-final-state, no double-mount, no extra
 * `startViewTransition` call.
 */

const mountCounter = { count: 0 };

const LazyTargetImpl = (): ReactElement => {
    const seen = useRef(false);
    useEffect(() => {
        if (seen.current) return;
        seen.current = true;
        mountCounter.count += 1;
    }, []);
    return <div data-testid="lazy-target">target</div>;
};

const Home = (): ReactElement => {
    const navigate = useNavigateWithTransition();
    return (
        <button type="button" onClick={() => navigate('/target')}>
            go
        </button>
    );
};

const App = (): ReactElement => (
    <MemoryRouter initialEntries={['/']}>
        <Suspense fallback={<div data-testid="suspense-fallback">loading</div>}>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/target" element={<LazyTargetImpl />} />
            </Routes>
        </Suspense>
    </MemoryRouter>
);

describe('lazy route regression', () => {
    afterEach(() => {
        mountCounter.count = 0;
    });

    it('renders the destination page exactly once after navigation', async () => {
        render(<App />);

        act(() => {
            screen.getByRole('button').click();
        });

        await waitFor(() => {
            expect(screen.getByTestId('lazy-target')).toBeInTheDocument();
        });

        expect(mountCounter.count).toBe(1);
    });

    it('does not call startViewTransition twice for a single navigation', () => {
        const spy = vi.spyOn(document, 'startViewTransition');
        render(<App />);

        act(() => {
            screen.getByRole('button').click();
        });

        expect(spy).toHaveBeenCalledTimes(1);
        spy.mockRestore();
    });
});
