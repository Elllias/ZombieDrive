import type { PoolClient } from 'pg';

import { nextStageId, type RunReport, type StageId } from '@zombie-drive/shared';

export async function persistStageResult(
    client: PoolClient,
    input: { playerId: string; stageId: StageId; report: RunReport },
): Promise<void> {
    const { playerId, stageId, report } = input;
    const distance = report.reason === 'abandon' ? 0 : report.distance;
    const completed = report.reason === 'finish';

    if (stageId === 'hills') {
        await client.query(`UPDATE players SET best_distance = GREATEST(best_distance, $2),
            completed_hills = completed_hills OR $3 WHERE id = $1`, [ playerId, distance, completed ]);
    } else {
        await client.query(`UPDATE stage_progress SET best_distance = GREATEST(best_distance, $3),
            completed = completed OR $4 WHERE player_id = $1 AND stage_id = $2`, [
            playerId, stageId, distance, completed,
        ]);
    }

    const next = completed ? nextStageId(stageId) : null;

    if (next) {
        await client.query(`INSERT INTO stage_progress(player_id, stage_id) VALUES($1, $2)
            ON CONFLICT DO NOTHING`, [ playerId, next ]);
    }
}
