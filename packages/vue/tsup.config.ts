import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    sourcemap: true,
    external: ['vue', 'vue-router', '@lemoncloud/page-transition-core'],
    outExtension: ({ format }) => ({
        js: format === 'esm' ? '.mjs' : '.cjs',
    }),
});
