import type { PoolClient } from 'pg';

import type { StageId } from '@zombie-drive/shared';

import { StageRowSchema } from './records';
import { DomainError } from './errors';

const CompletionRowSchema = StageRowSchema.pick({ completed: true });

export async function readStageCompletion(client: PoolClient, playerId: string, stageId: StageId): Promise<boolean> {
    const result = stageId === 'hills'
        ? await client.query('SELECT completed_hills AS completed FROM players WHERE id = $1', [ playerId ])
        : await client.query('SELECT completed FROM stage_progress WHERE player_id = $1 AND stage_id = $2', [
            playerId, stageId,
        ]);

    if (!result.rows[0]) {
        throw new DomainError(409, 'Прогресс этапа не найден.');
    }

    return CompletionRowSchema.parse(result.rows[0]).completed;
}
