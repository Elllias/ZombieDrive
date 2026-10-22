import type { PoolClient } from 'pg';

import { type RunReport, type Settlement } from '@zombie-drive/shared';

import { DomainError } from './errors';
import { RunRowSchema, type RunRow } from './records';
import { runReward } from './runReward';
import { persistStageResult } from './persistStageResult';
import { readProgress } from './readProgress';
import { readStageCompletion } from './readStageCompletion';
import { validateReport } from './validateReport';

interface FinishRunInput {
    playerId: string;
    runId: string;
    report: RunReport;
}

export async function finishRun(client: PoolClient, input: FinishRunInput): Promise<Settlement> {
    const { playerId, runId, report } = input;

    const result = await client.query('SELECT * FROM runs WHERE id = $1 AND player_id = $2', [
        runId,
        playerId,
    ]);

    if (!result.rows[0]) {
        throw new DomainError(404, 'Заезд не найден.');
    }

    const run = RunRowSchema.parse(result.rows[0]);

    if (run.state !== 'active') {
        return { reward: run.reward ?? 0, progress: await readProgress(client, playerId) };
    }

    validateReport(report, run);

    const reward = await calculateReward(client, input, run);

    await persistSettlement(client, input, reward);
    await persistStageResult(client, { playerId, stageId: run.stage_id, report });

    return { reward, progress: await readProgress(client, playerId) };
}

async function calculateReward(client: PoolClient, input: FinishRunInput, run: RunRow): Promise<number> {
    const completed = await readStageCompletion(client, input.playerId, run.stage_id);

    return completed ? 0 : runReward(input.report, run.rules);
}

async function persistSettlement(client: PoolClient, input: FinishRunInput, reward: number): Promise<void> {
    const { playerId, runId, report } = input;

    await client.query('UPDATE runs SET state = $2, report = $3, reward = $4 WHERE id = $1', [
        runId,
        report.reason === 'abandon' ? 'abandoned' : 'finished',
        report,
        reward,
    ]);

    await client.query(
        'UPDATE players SET balance = balance + $2 WHERE id = $1',
        [ playerId, reward ],
    );
}
