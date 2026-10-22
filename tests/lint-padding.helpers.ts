import { Linter } from 'eslint';
import tseslint from 'typescript-eslint';

import paddingAroundMultiline from '../scripts/eslint/paddingAroundMultiline.mjs';

const CONFIGURATION = {
    files: [ '**/*.tsx' ],
    languageOptions: { parser: tseslint.parser, parserOptions: { ecmaFeatures: { jsx: true } } },
    plugins: { layout: { rules: { padding: paddingAroundMultiline } } },
    rules: { 'layout/padding': 'error' },
} satisfies Linter.Config;

export function formatMultiline(source: string): ReturnType<Linter['verifyAndFix']> {
    const linter = new Linter();

    return linter.verifyAndFix(source, [ CONFIGURATION ], { filename: 'fixture.tsx' });
}
