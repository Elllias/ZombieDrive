import { randomUUID } from 'node:crypto';

import type { PoolClient } from 'pg';

import { carStats, GAME_CONFIG, rulesSnapshot, stageConfig, type Run, type Progress } from '@zombie-drive/shared';

import { RunRowSchema, type RunRow } from './records';
import { readProgress } from './readProgress';
import { toRun } from './toRun';
import { DomainError } from './errors';

export async function startRun(client: PoolClient, playerId: string, key: string): Promise<Run> {
    const previous = await client.query('SELECT * FROM runs WHERE player_id = $1 AND start_key = $2', [
        playerId,
        key,
    ]);

    if (previous.rows[0]) {
        return retryActiveRun(RunRowSchema.parse(previous.rows[0]));
    }

    const progress = await readProgress(client, playerId);

    if (progress.activeRun) {
        throw new DomainError(409, 'Завершите предыдущий заезд.');
    }

    return insertRun(client, { playerId, key, progress });
}

function retryActiveRun(run: RunRow): Run {
    if (run.state !== 'active' || run.expires_at.getTime() <= Date.now()) {
        throw new DomainError(410, 'Эта попытка уже завершена. Начни новый заезд.');
    }

    return toRun(run);
}

async function insertRun(
    client: PoolClient,
    input: { playerId: string; key: string; progress: Progress },
): Promise<Run> {
    const { playerId, key, progress } = input;
    const stage = stageConfig(progress.stageId);
    const stats = carStats(progress.upgrades, stage.vehicleId);
    const expires = new Date(Date.now() + GAME_CONFIG.run.lifetimeSeconds * 1000);

    const result = await client.query(
        `INSERT INTO runs(id, player_id, start_key, configuration_version, stats, expires_at, rules, stage_id)
     VALUES($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [ randomUUID(), playerId, key, GAME_CONFIG.version, stats, expires, rulesSnapshot(stage.id), stage.id ],
    );

    return toRun(RunRowSchema.parse(result.rows[0]));
}
