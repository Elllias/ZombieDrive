import type { PoolClient } from 'pg';

import { PlayerRowSchema } from './records';
import { DomainError } from './errors';

export async function lockPlayer(client: PoolClient, playerId: string): Promise<void> {
    const result = await client.query('SELECT * FROM players WHERE id = $1 FOR UPDATE', [ playerId ]);

    if (!result.rows[0]) {
        throw new DomainError(401, 'Гостевая сессия истекла. Откройте игру заново.');
    }

    PlayerRowSchema.parse(result.rows[0]);

    await client.query(
        "UPDATE runs SET state = 'abandoned', reward = 0 WHERE player_id = $1 AND state = 'active' AND expires_at <= now()",
        [ playerId ],
    );
}
