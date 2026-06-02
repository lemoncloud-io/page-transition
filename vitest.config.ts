import { resolve } from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            // Most specific aliases must come first — Vite picks the
            // first match. Deep import is used by the test setup to
            // reset module-level state between tests.
            '@lemoncloud/page-transition-core/transition-state': resolve(
                __dirname,
                'packages/core/src/transition-state.ts',
            ),
            '@lemoncloud/page-transition-core': resolve(__dirname, 'packages/core/src/index.ts'),
        },
    },
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./packages/react/test/setup.ts'],
        include: ['packages/**/*.{test,spec}.{ts,tsx}'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: ['node_modules/', 'dist/', '**/test/', '**/*.d.ts'],
        },
    },
});
