import { createHmac, timingSafeEqual } from 'node:crypto';

import { z } from 'zod';

import { TELEGRAM_AUTH_MAX_AGE_SECONDS, TELEGRAM_CLOCK_TOLERANCE_SECONDS } from '../configs/auth';
import { DomainError } from '../domain/errors';

const TelegramUserSchema = z.object({
    id: z.number().int().positive(),
    first_name: z.string().max(256),
    last_name: z.string().max(256).optional(),
    username: z.string().max(256).optional(),
});

export type TelegramUser = z.infer<typeof TelegramUserSchema>;

export function validateTelegramData(initData: string, botToken?: string): TelegramUser {
    if (!botToken) {
        throw new DomainError(503, 'Вход через Telegram пока не настроен на сервере.');
    }

    const parameters = new URLSearchParams(initData);

    if (new Set(parameters.keys()).size !== parameters.size) {
        throw invalidTelegramData();
    }

    verifyHash(parameters, botToken);
    verifyDate(parameters.get('auth_date'));

    return parseUser(parameters.get('user'));
}

function verifyHash(parameters: URLSearchParams, botToken: string): void {
    const hash = parameters.get('hash') ?? '';

    if (!/^[0-9a-f]{64}$/.test(hash)) {
        throw invalidTelegramData();
    }

    parameters.delete('hash');
    parameters.sort();

    const data = Array.from(parameters, ([ key, value ]) => `${ key }=${ value }`).join('\n');
    const secret = createHmac('sha256', 'WebAppData').update(botToken).digest();
    const expected = createHmac('sha256', secret).update(data).digest();

    if (!timingSafeEqual(expected, Buffer.from(hash, 'hex'))) {
        throw invalidTelegramData();
    }
}

function verifyDate(value: string | null): void {
    const now = Math.floor(Date.now() / 1000);
    const issuedAt = value && /^\d+$/.test(value) ? Number(value) : NaN;

    if (!Number.isSafeInteger(issuedAt) || issuedAt > now + TELEGRAM_CLOCK_TOLERANCE_SECONDS
        || now - issuedAt > TELEGRAM_AUTH_MAX_AGE_SECONDS) {
        throw invalidTelegramData();
    }
}

function parseUser(value: string | null): TelegramUser {
    try {
        const data: unknown = JSON.parse(value ?? 'null');
        const result = TelegramUserSchema.safeParse(data);

        if (result.success) {
            return result.data;
        }
    } catch {
        // Malformed signed JSON is an authentication failure, not a server error.
    }

    throw invalidTelegramData();
}

function invalidTelegramData(): DomainError {
    return new DomainError(401, 'Не удалось подтвердить вход. Закрой игру и открой её заново через Telegram.');
}
