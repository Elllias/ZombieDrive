import type { PoolClient } from 'pg';
import { z } from 'zod';

import { TELEGRAM_LOCK_NAMESPACE } from '../configs/auth';

import type { TelegramUser } from './validateTelegramData';
import { createPlayer, findSession, hashSession, newSessionToken, saveSession } from './sessionStore';

const PlayerIdSchema = z.object({ id: z.string().uuid() });

export async function telegramSession(client: PoolClient, user: TelegramUser, previous?: string): Promise<string> {
    await client.query('SELECT pg_advisory_xact_lock($1, hashtext($2))', [
        TELEGRAM_LOCK_NAMESPACE, String(user.id),
    ]);

    const existing = await client.query('SELECT id FROM players WHERE telegram_id = $1', [ String(user.id) ]);

    if (existing.rows[0]) {
        return existingSession(client, PlayerIdSchema.parse(existing.rows[0]).id, user, previous);
    }

    const guest = await findSession(client, previous);
    const token = newSessionToken();
    const playerId = guest?.telegram_id === null ? guest.id : await createPlayer(client, token);

    await updateTelegramProfile(client, playerId, user);
    await rotateGuestSession(client, playerId, token);

    return saveSession(client, playerId, token);
}

async function existingSession(
    client: PoolClient, playerId: string, user: TelegramUser, previous?: string,
): Promise<string> {
    const session = await findSession(client, previous, playerId);

    await updateTelegramProfile(client, playerId, user);

    if (session && previous) {
        return previous;
    }

    return saveSession(client, playerId, newSessionToken());
}

async function updateTelegramProfile(client: PoolClient, playerId: string, user: TelegramUser): Promise<void> {
    await client.query(
        `UPDATE players SET telegram_id = $2, telegram_username = $3, telegram_first_name = $4,
         telegram_last_name = $5, last_seen = now() WHERE id = $1`,
        [ playerId, String(user.id), user.username ?? null, user.first_name, user.last_name ?? null ],
    );
}

async function rotateGuestSession(client: PoolClient, playerId: string, token: string): Promise<void> {
    await client.query('UPDATE players SET session_hash = $2 WHERE id = $1', [ playerId, hashSession(token) ]);
    await client.query('DELETE FROM player_sessions WHERE player_id = $1', [ playerId ]);
}
