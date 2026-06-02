import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

import { __resetTransitionState } from '@lemoncloud/page-transition-core/transition-state';

afterEach(() => {
    cleanup();
});

// Module-level state in transition-state is shared across every test
// file. Resetting before each test keeps concurrent-dedup state from
// leaking between suites.
beforeEach(() => {
    __resetTransitionState();
});

// Mock View Transitions API. The mock awaits the callback so async
// navigation paths (the default behavior after dropping flushSync)
// are exercised faithfully — otherwise tests pass against a sync
// model the browser doesn't use.
const createMockViewTransition = () => ({
    finished: Promise.resolve(),
    ready: Promise.resolve(),
    updateCallbackDone: Promise.resolve(),
    skipTransition: vi.fn(),
});

Object.defineProperty(document, 'startViewTransition', {
    value: vi.fn((callback: () => void | Promise<void>) => {
        const mock = createMockViewTransition();
        const result = callback();
        if (result && typeof (result as Promise<void>).then === 'function') {
            mock.finished = (result as Promise<void>).then(
                () => undefined,
                () => undefined,
            );
        }
        return mock;
    }),
    writable: true,
    configurable: true,
});
