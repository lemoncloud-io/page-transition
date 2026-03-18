import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactHooksPlugin from 'eslint-plugin-react-hooks';

export default [
    {
        ignores: ['**/dist/**', '**/node_modules/**', 'coverage/', '*.config.*', 'examples/**'],
    },
    js.configs.recommended,
    {
        files: ['packages/*/src/**/*.ts', 'packages/*/src/**/*.tsx', 'packages/*/test/**/*.ts', 'packages/*/test/**/*.tsx'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
                ecmaFeatures: {
                    jsx: true,
                },
            },
            globals: {
                document: 'readonly',
                window: 'readonly',
                navigator: 'readonly',
                console: 'readonly',
                global: 'readonly',
            },
        },
        plugins: {
            '@typescript-eslint': tsPlugin,
            'react-hooks': reactHooksPlugin,
        },
        rules: {
            ...tsPlugin.configs.recommended.rules,
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/no-explicit-any': 'error',
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'warn',
            'no-console': ['warn', { allow: ['warn', 'error'] }],
        },
    },
];
