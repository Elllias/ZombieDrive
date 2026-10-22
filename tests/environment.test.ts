import { expect, it } from 'vitest';

import { readEnvironment } from '../apps/api/src/environment';

const DATABASE_URL = 'postgresql://test:example@localhost:5432/test';

it.each([ 'https://game.example/', 'HTTPS://GAME.EXAMPLE:443/' ])('normalizes a public origin: %s', (APP_ORIGIN): void => {
    const environment = readEnvironment({ DATABASE_URL, APP_ORIGIN, NODE_ENV: 'production' });

    expect(environment.APP_ORIGIN).toBe('https://game.example');
});

it.each([
    'https://game.example/path',
    'https://game.example?query=1',
    'https://game.example/#fragment',
    'https://user:password@game.example',
    'ftp://game.example',
])('rejects an invalid application origin: %s', (APP_ORIGIN): void => {
    expect(() => readEnvironment({ DATABASE_URL, APP_ORIGIN })).toThrow('APP_ORIGIN must be');
});

it('requires HTTPS in production', (): void => {
    expect(() => readEnvironment({ DATABASE_URL, NODE_ENV: 'production' })).toThrow('must use HTTPS');
});

it('accepts a server-only Telegram bot token and an unset optional token', (): void => {
    expect(readEnvironment({ DATABASE_URL, TELEGRAM_BOT_TOKEN: '123:test_token' }).TELEGRAM_BOT_TOKEN)
        .toBe('123:test_token');

    expect(readEnvironment({ DATABASE_URL, TELEGRAM_BOT_TOKEN: '' }).TELEGRAM_BOT_TOKEN).toBeUndefined();
    expect(() => readEnvironment({ DATABASE_URL, TELEGRAM_BOT_TOKEN: 'invalid' })).toThrow();
});
