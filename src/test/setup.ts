import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
    cleanup();
});

// Mock View Transitions API
const mockViewTransition = {
    finished: Promise.resolve(),
    ready: Promise.resolve(),
    updateCallbackDone: Promise.resolve(),
    skipTransition: vi.fn(),
};

Object.defineProperty(document, 'startViewTransition', {
    value: vi.fn((callback: () => void) => {
        callback();
        return mockViewTransition;
    }),
    writable: true,
});
