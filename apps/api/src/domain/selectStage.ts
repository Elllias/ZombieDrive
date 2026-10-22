import type { PoolClient } from 'pg';

import type { Progress, StageId } from '@zombie-drive/shared';

import { readProgress } from './readProgress';
import { DomainError } from './errors';

export async function selectStage(client: PoolClient, playerId: string, stageId: StageId): Promise<Progress> {
    const progress = await readProgress(client, playerId);
    const isUnlocked = progress.stages?.some((stage) => stage.stageId === stageId);

    if (!isUnlocked || progress.activeRun) {
        throw new DomainError(409, 'Этап недоступен. Сначала завершите заезд.');
    }

    await client.query('UPDATE players SET selected_stage = $2 WHERE id = $1', [ playerId, stageId ]);

    return readProgress(client, playerId);
}
