import type { PoolClient } from 'pg';

import type { Progress } from '@zombie-drive/shared';

import { PlayerRowSchema, RunRowSchema, StageRowSchema } from './records';
import { toRun } from './toRun';

export async function readProgress(client: PoolClient, playerId: string): Promise<Progress> {
    const playerResult = await client.query('SELECT * FROM players WHERE id = $1', [ playerId ]);
    const player = PlayerRowSchema.parse(playerResult.rows[0]);
    const stageResult = await client.query('SELECT * FROM stage_progress WHERE player_id = $1', [ playerId ]);
    const stages = StageRowSchema.array().parse(stageResult.rows);
    const selected = stages.find((stage) => stage.stage_id === player.selected_stage);
    const runs = await client.query("SELECT * FROM runs WHERE player_id = $1 AND state = 'active'", [ playerId ]);
    const active = runs.rows[0];

    return {
        stageId: selected?.stage_id ?? 'hills',

        stages: [
            { stageId: 'hills', bestDistance: player.best_distance, completed: player.completed_hills },

            ...stages.map((stage) => ({
                stageId: stage.stage_id, bestDistance: stage.best_distance, completed: stage.completed,
            })),
        ],

        balance: player.balance,
        bestDistance: selected?.best_distance ?? player.best_distance,
        upgrades: selected?.upgrades ?? player.upgrades,
        activeRun: active ? toRun(RunRowSchema.parse(active)) : null,
    };
}
