import { Pool } from 'pg';
import { z } from 'zod';
import { beforeAll, afterAll, it, expect, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { STAGE_IDS, SettlementSchema, stageConfig, type StageId, type Run, type RunReport,
    type Settlement } from '@zombie-drive/shared';

import { createApp } from '../apps/api/src/createApp';
import { migrate } from '../apps/api/src/database/migrate';
import { ResultScreen } from '../apps/web/src/ui/result/ResultScreen';

import { guest, start, send, VALID_REPORT } from './api.helpers';
import { select } from './stages-api.helpers';

const pool = new Pool({ connectionString: z.string().parse(process.env.DATABASE_URL) });
let application: FastifyInstance | null = null;

function app(): FastifyInstance {
    if (!application) {
        throw new Error('Test application not ready');
    }

    return application;
}

beforeAll(async (): Promise<void> => {
    await migrate(pool);
    application = await createApp({ pool, origin: 'http://localhost:5173' });
});

afterAll(async (): Promise<void> => {
    await application?.close();
    await pool.end();
});

async function settle(cookie: string, run: Run, report: RunReport): Promise<Settlement> {
    const reply = await send(app(), cookie, { method: 'POST', url: `/api/runs/${ run.id }/finish`, payload: report });
    const data: unknown = reply.json();

    expect(reply.statusCode).toBe(200);

    return SettlementSchema.parse(data);
}

async function completeStage(cookie: string, stageId: StageId): Promise<{
    run: Run; report: RunReport; settlement: Settlement;
}> {
    await select(app(), cookie, stageId);

    const stage = stageConfig(stageId);
    const run = await start(app(), cookie);

    const report: RunReport = {
        distance: stage.track.length,
        elapsedSeconds: 160,
        reason: 'finish',
        killedZombieIds: stage.zombies.map((zombie) => zombie.id),
    };

    await pool.query("UPDATE runs SET started_at = now() - interval '170 seconds' WHERE id = $1", [ run.id ]);

    return { run, report, settlement: await settle(cookie, run, report) };
}

async function completeThrough(cookie: string, target: StageId): Promise<Awaited<ReturnType<typeof completeStage>>> {
    for (const stageId of STAGE_IDS) {
        const result = await completeStage(cookie, stageId);

        if (stageId === target) {
            return result;
        }
    }

    throw new Error('Campaign stage not found');
}

it.each(STAGE_IDS)('pays the first finish but no distance or kills on replays: %s', async (stageId): Promise<void> => {
    const cookie = await guest(app());
    const first = await completeThrough(cookie, stageId);
    const replay = await completeStage(cookie, stageId);

    expect(first.settlement.reward).toBeGreaterThan(0);
    expect(replay.settlement.reward).toBe(0);
    expect(replay.settlement.progress.balance).toBe(first.settlement.progress.balance);
    expect(replay.settlement.progress.stages?.find((stage) => stage.stageId === stageId)?.completed).toBe(true);

    const retry = await settle(cookie, first.run, first.report);

    expect(retry.reward).toBe(first.settlement.reward);
    expect(retry.progress.balance).toBe(first.settlement.progress.balance);
});

it.each([ 'fuel', 'rollover', 'stuck', 'timeout' ] as const)(
    'rejects a full-distance report with reason %s instead of leaving the stage uncompleted',
    async (reason): Promise<void> => {
        const cookie = await guest(app());
        const run = await start(app(), cookie);
        const report: RunReport = { distance: 1740, elapsedSeconds: 160, killedZombieIds: [], reason };

        await pool.query("UPDATE runs SET started_at = now() - interval '170 seconds' WHERE id = $1", [ run.id ]);

        const reply = await send(app(), cookie, { method: 'POST', url: `/api/runs/${ run.id }/finish`, payload: report });
        const progress = await selectProgress(cookie);

        expect(reply.statusCode).toBe(422);
        expect(progress.balance).toBe(0);
        expect(progress.activeRun?.id).toBe(run.id);
        expect(progress.stages?.find((stage) => stage.stageId === 'hills')?.completed).toBe(false);
        expect((await settle(cookie, run, { ...report, reason: 'finish' })).reward).toBe(522);
    },
);

it('continues rewarding repeated attempts while the stage has not been completed', async (): Promise<void> => {
    const cookie = await guest(app());
    const first = await settle(cookie, await start(app(), cookie), { ...VALID_REPORT, killedZombieIds: [ 'zombie-0' ] });
    const second = await settle(cookie, await start(app(), cookie), { ...VALID_REPORT, killedZombieIds: [ 'zombie-0' ] });

    expect(first.reward).toBe(16);
    expect(second.reward).toBe(16);
    expect(second.progress.balance).toBe(32);
    expect(second.progress.stages?.find((stage) => stage.stageId === 'hills')?.completed).toBe(false);
});

it('returns the first finish reward to concurrent retries after marking the stage completed', async (): Promise<void> => {
    const cookie = await guest(app());
    const run = await start(app(), cookie);
    const report: RunReport = { distance: 1740, elapsedSeconds: 160, killedZombieIds: [], reason: 'finish' };

    await pool.query("UPDATE runs SET started_at = now() - interval '170 seconds' WHERE id = $1", [ run.id ]);

    const settlements = await Promise.all([ settle(cookie, run, report), settle(cookie, run, report) ]);

    expect(settlements.map((result) => result.reward)).toEqual([ 522, 522 ]);
    expect(settlements.map((result) => result.progress.balance)).toEqual([ 522, 522 ]);
});

it('settles concurrent replay reports with zero reward and preserves the record', async (): Promise<void> => {
    const cookie = await guest(app());
    const first = await completeThrough(cookie, 'industrial');
    const run = await start(app(), cookie);

    const report: RunReport = {
        ...VALID_REPORT, killedZombieIds: [ 'industrial-zombie-0', 'industrial-zombie-1' ],
    };

    const settlements = await Promise.all([ settle(cookie, run, report), settle(cookie, run, report) ]);

    for (const result of settlements) {
        expect(result.reward).toBe(0);
        expect(result.progress.balance).toBe(first.settlement.progress.balance);
        expect(result.progress.bestDistance).toBe(2100);
        expect(result.progress.activeRun).toBeNull();
    }
});

it('checks the run stage instead of the currently selected garage', async (): Promise<void> => {
    const cookie = await guest(app());
    const first = await completeThrough(cookie, 'hills');
    const run = await start(app(), cookie);

    await pool.query(`UPDATE players SET selected_stage = 'industrial'
        WHERE id = (SELECT player_id FROM runs WHERE id = $1)`, [ run.id ]);

    const result = await settle(cookie, run, { ...VALID_REPORT, killedZombieIds: [ 'zombie-0' ] });

    expect(result.progress.stageId).toBe('industrial');
    expect(result.reward).toBe(0);
    expect(result.progress.balance).toBe(first.settlement.progress.balance);
});

it('still validates reports on completed stages and keeps invalid attempts active', async (): Promise<void> => {
    const cookie = await guest(app());
    const first = await completeThrough(cookie, 'hills');
    const run = await start(app(), cookie);

    const reply = await send(app(), cookie, { method: 'POST',
        url: `/api/runs/${ run.id }/finish`,
        payload: { ...VALID_REPORT, killedZombieIds: [ 'invented' ] } });

    const current = await selectProgress(cookie);

    expect(reply.statusCode).toBe(422);
    expect(current.activeRun?.id).toBe(run.id);
    expect(current.balance).toBe(first.settlement.progress.balance);
});

async function selectProgress(cookie: string): Promise<Settlement['progress']> {
    const reply = await send(app(), cookie, { url: '/api/progress' });
    const data: unknown = reply.json();

    return SettlementSchema.shape.progress.parse(data);
}

function resultMarkup(run: Run, report: RunReport, settlement: Settlement): string {
    return renderToStaticMarkup(createElement(ResultScreen, {
        run,
        report,
        settlement,
        isBusy: false,
        error: null,
        canDiscard: false,
        onRetry: vi.fn(),
        onGarage: vi.fn(),
        onDiscard: vi.fn(),
    }));
}

it('does not announce an unlock after an expired first finish', async (): Promise<void> => {
    const cookie = await guest(app());
    const run = await start(app(), cookie);
    const report: RunReport = { distance: 1740, elapsedSeconds: 160, killedZombieIds: [], reason: 'finish' };

    await pool.query("UPDATE runs SET expires_at = now() - interval '1 second' WHERE id = $1", [ run.id ]);

    const result = await settle(cookie, run, report);
    const markup = resultMarkup(run, report, result);

    expect(result.reward).toBe(0);
    expect(result.progress.balance).toBe(0);
    expect(result.progress.stages).toHaveLength(1);
    expect(markup).not.toContain('Следующий этап');
    expect(markup).not.toContain('В гараж КамАЗ');
});

it('shows one garage button after a finish including a completed-stage replay', async (): Promise<void> => {
    const cookie = await guest(app());

    await completeThrough(cookie, 'hills');

    const replay = await completeStage(cookie, 'hills');
    const markup = resultMarkup(replay.run, replay.report, replay.settlement);

    expect(replay.settlement.reward).toBe(0);
    expect(markup.match(/<button\b/g)).toHaveLength(1);
    expect(markup).toContain('В гараж</button>');
    expect(markup).not.toContain('В гараж КамАЗ');
    expect(markup).not.toContain('Открыт следующий этап');
});
