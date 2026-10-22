import type { FastifyRequest } from 'fastify';
import type { Pool } from 'pg';

import { SESSION_COOKIE } from './configs/auth';
import { DomainError } from './domain/errors';
import { transaction } from './database/transaction';
import { createPlayer, findSession, newSessionToken, saveSession } from './auth/sessionStore';
import { validateTelegramData } from './auth/validateTelegramData';
import { telegramSession } from './auth/telegramSession';

interface SessionInput {
    previous?: string;
    initData?: string;
    botToken?: string;
}

export async function createSession(pool: Pool, input: SessionInput): Promise<string> {
    const user = input.initData ? validateTelegramData(input.initData, input.botToken) : null;

    return transaction(pool, async (client): Promise<string> => {
        if (user) {
            return telegramSession(client, user, input.previous);
        }

        const player = await findSession(client, input.previous);

        if (player && input.previous) {
            return input.previous;
        }

        const token = newSessionToken();
        const playerId = await createPlayer(client, token);

        return saveSession(client, playerId, token);
    });
}

export async function authenticate(request: FastifyRequest, pool: Pool): Promise<string> {
    const player = await transaction(pool, (client) => findSession(client, request.cookies[SESSION_COOKIE]));

    if (!player) {
        throw new DomainError(401, 'Сессия истекла. Откройте игру заново.');
    }

    return player.id;
}
