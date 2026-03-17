import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    sourcemap: true,
    external: ['react', 'react-dom', 'react-router-dom', '@lemoncloud/page-transition-core'],
    outExtension: ({ format }) => ({
        js: format === 'esm' ? '.mjs' : '.cjs',
    }),
});
