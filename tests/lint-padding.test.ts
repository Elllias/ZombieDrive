import { expect, it } from 'vitest';

import { formatMultiline } from './lint-padding.helpers';

it('separates exported multiline constants from the declarations on either side', (): void => {
    const source = 'export const a = 1;\nexport const b = {\n    value: 2,\n};\nexport const c = 3;';
    const expected = 'export const a = 1;\n\nexport const b = {\n    value: 2,\n};\n\nexport const c = 3;';

    expect(formatMultiline(source).output).toBe(expected);
});

it('pads multiline declarations inside functions and preserves single-line groups', (): void => {
    const source = 'function read() {\n    const a = 1;\n    const b = {\n        a,\n    };\n    const c = 2;\n    const d = 3;\n}';
    const expected = 'function read() {\n    const a = 1;\n\n    const b = {\n        a,\n    };\n\n    const c = 2;\n    const d = 3;\n}';

    expect(formatMultiline(source).output).toBe(expected);
});

it('separates nested object properties around a multiline value', (): void => {
    const source = 'const settings = {\n    a: 1,\n    b: {\n        c: 2,\n    },\n    d: 3,\n};';
    const expected = 'const settings = {\n    a: 1,\n\n    b: {\n        c: 2,\n    },\n\n    d: 3,\n};';

    expect(formatMultiline(source).output).toBe(expected);
});

it('separates multiline array items without padding the array edges', (): void => {
    const source = 'const shots = [\n    {\n        start: 0,\n    },\n    {\n        start: 100,\n    },\n];';
    const expected = 'const shots = [\n    {\n        start: 0,\n    },\n\n    {\n        start: 100,\n    },\n];';

    expect(formatMultiline(source).output).toBe(expected);
});

it('separates JSX siblings around multiline elements', (): void => {
    const source = 'const view = <main>\n    <img />\n    <section>\n        <span />\n    </section>\n    <button />\n</main>;';
    const expected = 'const view = <main>\n    <img />\n\n    <section>\n        <span />\n    </section>\n\n    <button />\n</main>;';

    expect(formatMultiline(source).output).toBe(expected);
});

it('keeps leading comments attached to the following declaration', (): void => {
    const source = 'const a = {\n    value: 1,\n};\n// Explanation for b.\nconst b = 2;';
    const expected = 'const a = {\n    value: 1,\n};\n\n// Explanation for b.\nconst b = 2;';

    expect(formatMultiline(source).output).toBe(expected);
});

it('keeps trailing comments on the preceding declaration', (): void => {
    const source = 'const a = {\n    value: 1,\n}; // Explanation for a.\nconst b = 2;';
    const expected = 'const a = {\n    value: 1,\n}; // Explanation for a.\n\nconst b = 2;';

    expect(formatMultiline(source).output).toBe(expected);
});

it('does not count blank lines inside a comment as statement padding', (): void => {
    const source = 'const a = {\n    value: 1,\n};\n/* Comment\n\n   for b. */\nconst b = 2;';
    const expected = 'const a = {\n    value: 1,\n};\n\n/* Comment\n\n   for b. */\nconst b = 2;';

    expect(formatMultiline(source).output).toBe(expected);
});

it.each([
    'export const value = {\n    data: 1,\n};',
    'function read() {\n    const value = {\n        data: 1,\n    };\n}',
    'const a = 1;\nconst b = 2;',
    'const a = {\n    data: 1,\n};\n\nconst b = 2;',
    'const template = `unchanged\n\n  text`;\n',
    'const view = <p>Будь <strong>\n    {label}\n</strong> осторожен</p>;',
    'const values = [\n    ,\n    {\n        value: 1,\n    },\n];',
])('leaves already valid content unchanged: %s', (source): void => {
    expect(formatMultiline(source)).toMatchObject({ output: source, fixed: false, messages: [] });
});

it('produces a stable result after the first formatting pass', (): void => {
    const source = 'const a = 1;\nconst b = {\n    value: 2,\n};\nconst c = 3;';
    const formatted = formatMultiline(source);

    expect(formatted.messages).toEqual([]);
    expect(formatMultiline(formatted.output)).toMatchObject({ output: formatted.output, fixed: false, messages: [] });
});
