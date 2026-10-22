import type { PoolClient } from 'pg';

import type { StageId, Upgrades } from '@zombie-drive/shared';

export async function saveUpgrades(
    client: PoolClient,
    input: { playerId: string; stageId: StageId; upgrades: Upgrades },
): Promise<void> {
    if (input.stageId === 'hills') {
        await client.query('UPDATE players SET upgrades = $2 WHERE id = $1', [ input.playerId, input.upgrades ]);

        return;
    }

    await client.query('UPDATE stage_progress SET upgrades = $3 WHERE player_id = $1 AND stage_id = $2', [
        input.playerId, input.stageId, input.upgrades,
    ]);
}
