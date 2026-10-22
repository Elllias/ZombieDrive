import { afterEach, expect, it, vi } from 'vitest';

import { validateTelegramData } from '../apps/api/src/auth/validateTelegramData';

import { signedTelegramData, telegramUser, TEST_BOT_TOKEN } from './telegram-auth.helpers';

afterEach((): void => {
    vi.useRealTimers();
});

it('matches the published Telegram Mini Apps validation example', (): void => {
    // https://github.com/Telegram-Mini-Apps/tma.js/blob/master/apps/docs/platform/init-data.md
    vi.useFakeTimers();
    vi.setSystemTime(1662771648 * 1000 + 1000);

    const user = { id: 279058397,
        first_name: 'Vladislav',
        last_name: 'Kibenko',
        username: 'vdkfrost',
        language_code: 'ru',
        is_premium: true };

    const parameters = new URLSearchParams({
        query_id: 'AAHdF6IQAAAAAN0XohDhrOrc',
        user: JSON.stringify(user),
        auth_date: '1662771648',
        hash: 'c501b71e775f74ce10e377dea85a7ea24ecd640b223ea86dfe453e0eaed2e2b2',
    });

    expect(validateTelegramData(parameters.toString(), '5768337691:AAH5YkoiEuPk8-FZa32hStHTqXiLPtAEhx8').id)
        .toBe(user.id);
});

it('accepts 64-bit Telegram identifiers, Unicode names and additional signed fields', (): void => {
    const user = telegramUser();
    const raw = signedTelegramData(user, { signature: 'signed-extra-field', start_param: 'garage' });

    expect(validateTelegramData(raw, TEST_BOT_TOKEN)).toEqual(user);
});

it('rejects modified identity data and a different bot token', (): void => {
    const parameters = new URLSearchParams(signedTelegramData(telegramUser()));

    parameters.set('user', JSON.stringify(telegramUser()));
    expect(() => validateTelegramData(parameters.toString(), TEST_BOT_TOKEN)).toThrow('подтвердить вход');
    expect(() => validateTelegramData(signedTelegramData(telegramUser()), 'another:bot')).toThrow('подтвердить вход');
});

it.each([ -3601, 60 ])('rejects a signed launch with a clock offset of %s seconds', (offset): void => {
    const auth_date = String(Math.floor(Date.now() / 1000) + offset);

    expect(() => validateTelegramData(signedTelegramData(telegramUser(), { auth_date }), TEST_BOT_TOKEN))
        .toThrow('подтвердить вход');
});

it.each([ '', 'NaN', '-1', '1e10' ])('rejects an invalid auth_date: %s', (auth_date): void => {
    expect(() => validateTelegramData(signedTelegramData(telegramUser(), { auth_date }), TEST_BOT_TOKEN))
        .toThrow('подтвердить вход');
});

it.each([ '{}', 'null', '{broken', '{"id": "123", "first_name":"Player"}' ])(
    'rejects invalid signed user data: %s', (user): void => {
        expect(() => validateTelegramData(signedTelegramData(telegramUser(), { user }), TEST_BOT_TOKEN))
            .toThrow('подтвердить вход');
    },
);

it.each([ 'auth_date', 'user', 'hash' ])('rejects ambiguous duplicated %s parameters', (key): void => {
    const parameters = new URLSearchParams(signedTelegramData(telegramUser()));

    parameters.append(key, parameters.get(key) ?? '');
    expect(() => validateTelegramData(parameters.toString(), TEST_BOT_TOKEN)).toThrow('подтвердить вход');
});

it.each([ '', 'deadbeef', 'g'.repeat(64) ])('rejects an invalid signature format: %s', (hash): void => {
    const parameters = new URLSearchParams(signedTelegramData(telegramUser()));

    parameters.set('hash', hash);
    expect(() => validateTelegramData(parameters.toString(), TEST_BOT_TOKEN)).toThrow('подтвердить вход');
});

it('requires a configured bot token instead of creating an anonymous fallback', (): void => {
    expect(() => validateTelegramData(signedTelegramData(telegramUser()))).toThrow('не настроен');
});
