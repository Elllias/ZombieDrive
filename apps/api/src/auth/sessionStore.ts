import { createHash, randomBytes, randomUUID } from 'node:crypto';

import type { PoolClient } from 'pg';
import { z } from 'zod';

import { SESSION_DAYS } from '../configs/auth';

const SessionPlayerSchema = z.object({ id: z.string().uuid(), telegram_id: z.string().nullable() });

type SessionPlayer = z.infer<typeof SessionPlayerSchema>;

export function hashSession(token: string): string {
    return createHash('sha256').update(token).digest('hex');
}

export function newSessionToken(): string {
    return randomBytes(32).toString('hex');
}

export async function findSession(
    client: PoolClient, token?: string, playerId?: string,
): Promise<SessionPlayer | null> {
    if (!token) {
        return null;
    }

    const result = await client.query(
        `SELECT p.id, p.telegram_id::text FROM players p JOIN player_sessions s ON s.player_id = p.id
         WHERE s.session_hash = $1 AND s.last_seen > now() - make_interval(days => $2)
         AND ($3::uuid IS NULL OR p.id = $3) FOR UPDATE OF p`,
        [ hashSession(token), SESSION_DAYS, playerId ?? null ],
    );

    if (!result.rows[0]) {
        return null;
    }

    const player = SessionPlayerSchema.parse(result.rows[0]);

    await touchSession(client, token, player.id);

    return player;
}

async function touchSession(client: PoolClient, token: string, playerId: string): Promise<void> {
    await client.query('UPDATE players SET last_seen = now() WHERE id = $1', [ playerId ]);
    await client.query('UPDATE player_sessions SET last_seen = now() WHERE session_hash = $1', [ hashSession(token) ]);
}

export async function createPlayer(client: PoolClient, token: string): Promise<string> {
    const id = randomUUID();

    await client.query('INSERT INTO players(id, session_hash) VALUES($1, $2)', [ id, hashSession(token) ]);

    return id;
}

export async function saveSession(client: PoolClient, playerId: string, token: string): Promise<string> {
    await client.query('INSERT INTO player_sessions(session_hash, player_id) VALUES($1, $2)', [
        hashSession(token), playerId,
    ]);

    return token;
}
