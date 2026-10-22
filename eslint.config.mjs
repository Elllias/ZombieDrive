import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

import paddingAroundMultiline from './scripts/eslint/paddingAroundMultiline.mjs';

export default tseslint.config(
    { ignores: [ 'node_modules/**', 'dist/**', '.local/**', 'docs/**' ] },
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: [ '**/*.ts', '**/*.tsx', '**/*.mjs' ],
        plugins: { layout: { rules: { 'padding-around-multiline': paddingAroundMultiline } } },

        rules: {
            'layout/padding-around-multiline': 'error',
            '@typescript-eslint/consistent-type-assertions': [ 'error', { assertionStyle: 'never' } ],
            '@typescript-eslint/no-non-null-assertion': 'error',
            'max-lines': [ 'error', { max: 300, skipBlankLines: true, skipComments: true } ],
            'max-lines-per-function': [ 'error', { max: 25, skipBlankLines: true, skipComments: true } ],
            indent: [ 'error', 4, { SwitchCase: 1 } ],
            curly: [ 'error', 'all' ],
            eqeqeq: [ 'error', 'always' ],
            'array-bracket-spacing': [ 'error', 'always' ],
            'object-curly-spacing': [ 'error', 'always' ],
            'object-property-newline': [ 'error', { allowAllPropertiesOnSameLine: true } ],
            'quote-props': [ 'error', 'as-needed', { keywords: true, numbers: true } ],
            'comma-dangle': [ 'error', 'always-multiline' ],
            'comma-spacing': 'error',
            'comma-style': [ 'error', 'last' ],
            'template-curly-spacing': [ 'error', 'always' ],
            quotes: [ 'error', 'single', { avoidEscape: true } ],
            semi: [ 'error', 'always' ],
            'arrow-parens': [ 'error', 'always' ],
            'arrow-spacing': 'error',
            'keyword-spacing': 'error',
            'space-before-blocks': 'error',
            'space-infix-ops': 'error',
            'space-in-parens': [ 'error', 'never' ],
            'operator-linebreak': [ 'error', 'before', { overrides: { '=': 'after' } } ],
            'multiline-ternary': [ 'error', 'always-multiline' ],
            'max-statements-per-line': [ 'error', { max: 1 } ],
            'no-multi-spaces': 'error',

            'lines-between-class-members': [ 'error', {
                enforce: [
                    { blankLine: 'always', prev: 'field', next: 'method' },
                    { blankLine: 'always', prev: 'method', next: '*' },
                ],
            } ],

            'padding-line-between-statements': [
                'error',
                { blankLine: 'always', prev: '*', next: [ 'return', 'throw', 'if', 'for', 'while', 'try', 'switch' ] },
                { blankLine: 'always', prev: [ 'if', 'for', 'while', 'try', 'switch' ], next: '*' },
                { blankLine: 'always', prev: 'multiline-expression', next: '*' },
                { blankLine: 'always', prev: '*', next: 'multiline-expression' },
                { blankLine: 'always', prev: [ 'const', 'let' ], next: '*' },
                { blankLine: 'any', prev: [ 'const', 'let' ], next: [ 'const', 'let' ] },
                { blankLine: 'always', prev: 'expression', next: [ 'const', 'let' ] },
                { blankLine: 'always', prev: 'import', next: '*' },
                { blankLine: 'any', prev: 'import', next: 'import' },
            ],

            'no-multiple-empty-lines': [ 'error', { max: 1 } ],
            '@typescript-eslint/array-type': [ 'error', { 'default': 'generic', readonly: 'generic' } ],
            'max-params': [ 'error', 4 ],
            'max-depth': [ 'error', 3 ],
            complexity: [ 'error', 10 ],
            'max-len': [ 'error', { code: 120, ignoreUrls: true, ignoreStrings: true } ],
        },
    },
    {
        files: [ 'apps/web/src/configs/**/*.ts', 'packages/shared/src/configs/**/*.ts' ],

        rules: {
            'no-restricted-imports': [ 'error', {
                paths: [ 'react', 'react-dom', 'phaser', 'planck' ],
                patterns: [ '**/ui/**', '**/state/**', '**/game/**' ],
            } ],
        },
    },

    {
        files: [ '**/*.ts', '**/*.tsx' ],
        rules: { '@typescript-eslint/explicit-function-return-type': [ 'error', { allowExpressions: true } ] },
    },
);
