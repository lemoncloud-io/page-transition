import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [react()],
    server: {
        port: 3000,
    },
    resolve: {
        alias: {
            '@lemoncloud/react-page-transition/styles.css': resolve(
                __dirname,
                '../../dist/styles.css'
            ),
        },
    },
});
