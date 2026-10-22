import { randomUUID } from 'node:crypto';

import { expect, it, vi } from 'vitest';

import { GAME_CONFIG, carStats, nextStageId, type Progress, type Run } from '@zombie-drive/shared';

import { API } from '../apps/web/src/api/client';
import { ApiError } from '../apps/web/src/api/ApiError';
import { AppActions } from '../apps/web/src/state/AppActions';
import type { GarageState } from '../apps/web/src/state/types';

const PROGRESS: Progress = {
    stageId: 'hills',
    balance: 1000,
    bestDistance: 0,
    activeRun: null,
    upgrades: { engine: 0, tank: 0, tires: 0, suspension: 0 },
};

const RUN: Run = {
    id: randomUUID(),
    stageId: 'hills',
    configurationVersion: GAME_CONFIG.version,
    stats: carStats(PROGRESS.upgrades),
    expiresAt: new Date(Date.now() + 60000).toISOString(),
};

function garage(progress: Progress = PROGRESS): GarageState {
    return { screen: 'garage', progress, isBusy: false, error: null };
}

it('uses a new start key after confirming cancellation of a lost start', async (): Promise<void> => {
    const start = vi.fn<typeof API.start>().mockRejectedValueOnce(new Error('Lost response')).mockResolvedValue(RUN);
    const finish = vi.fn<typeof API.finish>().mockResolvedValue({ reward: 0, progress: PROGRESS });
    const actions = new AppActions({ ...API, start, finish }, vi.fn());

    await actions.start(garage());
    await actions.abandonActive(garage({ ...PROGRESS, activeRun: RUN }));
    await actions.start(garage());

    expect(finish).toHaveBeenCalledWith(RUN.id, {
        distance: 0,
        elapsedSeconds: 0,
        killedZombieIds: [],
        reason: 'abandon',
    });

    expect(start.mock.calls[0]?.[0]).toBeDefined();
    expect(start.mock.calls[1]?.[0]).not.toBe(start.mock.calls[0]?.[0]);
});

it('keeps the start key if cancellation is not confirmed', async (): Promise<void> => {
    const start = vi.fn<typeof API.start>().mockRejectedValueOnce(new Error('Lost response')).mockResolvedValue(RUN);
    const finish = vi.fn<typeof API.finish>().mockRejectedValue(new Error('Offline'));
    const actions = new AppActions({ ...API, start, finish }, vi.fn());

    await actions.start(garage());
    await actions.abandonActive(garage({ ...PROGRESS, activeRun: RUN }));
    await actions.start(garage());

    expect(start.mock.calls[1]?.[0]).toBe(start.mock.calls[0]?.[0]);
});

it.each([ true, false ])('resets a failed start only on confirmed stage selection: %s', async (confirmed): Promise<void> => {
    const start = vi.fn<typeof API.start>().mockRejectedValue(new Error('Lost response'));
    const selectStage = vi.fn<typeof API.selectStage>();

    if (confirmed) {
        selectStage.mockResolvedValue({ ...PROGRESS, stageId: 'industrial' });
    } else {
        selectStage.mockRejectedValue(new Error('Offline'));
    }

    const actions = new AppActions({ ...API, start, selectStage }, vi.fn());

    await actions.start(garage());
    await actions.selectStage(garage(), 'industrial');
    await actions.start(garage());

    expect(start.mock.calls[1]?.[0] === start.mock.calls[0]?.[0]).toBe(!confirmed);
});

it('retries a purchase with its original key and separates purchases by stage', async (): Promise<void> => {
    const purchase = vi.fn<typeof API.purchase>().mockRejectedValue(new Error('Lost response'));
    const actions = new AppActions({ ...API, purchase }, vi.fn());

    await actions.buy(garage(), 'engine');
    await actions.buy(garage(), 'engine');
    await actions.buy(garage({ ...PROGRESS, stageId: 'industrial' }), 'engine');

    const first = purchase.mock.calls[0]?.[0];
    const retry = purchase.mock.calls[1]?.[0];
    const otherStage = purchase.mock.calls[2]?.[0];

    expect(first).toBeDefined();
    expect(retry).toEqual(first);
    expect(otherStage?.key).not.toBe(first?.key);
    expect(otherStage?.stageId).toBe('industrial');
});

it('blocks requests while busy and stage selection during an active run', async (): Promise<void> => {
    const start = vi.fn<typeof API.start>();
    const purchase = vi.fn<typeof API.purchase>();
    const selectStage = vi.fn<typeof API.selectStage>();
    const finish = vi.fn<typeof API.finish>();
    const actions = new AppActions({ ...API, start, purchase, selectStage, finish }, vi.fn());
    const busy = { ...garage({ ...PROGRESS, activeRun: RUN }), isBusy: true };

    await actions.start(busy);
    await actions.buy(busy, 'engine');
    await actions.selectStage(busy, 'industrial');
    await actions.abandonActive(busy);
    await actions.selectStage(garage({ ...PROGRESS, activeRun: RUN }), 'industrial');

    expect(start).not.toHaveBeenCalled();
    expect(purchase).not.toHaveBeenCalled();
    expect(selectStage).not.toHaveBeenCalled();
    expect(finish).not.toHaveBeenCalled();
});

it('ends the stage sequence at the last available stage', (): void => {
    expect(nextStageId()).toBe('industrial');
    expect(nextStageId('industrial')).toBe('pass');
    expect(nextStageId('pass')).toBeNull();
});

it('keeps the replacement start key if recovering a closed attempt loses its response', async (): Promise<void> => {
    const start = vi.fn<typeof API.start>()
        .mockRejectedValueOnce(new Error('Lost original start response'))
        .mockRejectedValueOnce(new ApiError(410, 'Attempt expired'))
        .mockRejectedValueOnce(new Error('Lost replacement start response'))
        .mockResolvedValue(RUN);

    const actions = new AppActions({ ...API, start }, vi.fn());

    await actions.start(garage());
    await actions.start(garage());
    await actions.start(garage());

    expect(start).toHaveBeenCalledTimes(4);
    expect(start.mock.calls[1]?.[0]).toBe(start.mock.calls[0]?.[0]);
    expect(start.mock.calls[2]?.[0]).not.toBe(start.mock.calls[0]?.[0]);
    expect(start.mock.calls[3]?.[0]).toBe(start.mock.calls[2]?.[0]);
});

it('preserves the original start key on conflicts instead of creating another attempt', async (): Promise<void> => {
    const start = vi.fn<typeof API.start>().mockRejectedValue(new ApiError(409, 'Active run exists'));
    const actions = new AppActions({ ...API, start }, vi.fn());

    await actions.start(garage());
    await actions.start(garage());

    expect(start).toHaveBeenCalledTimes(2);
    expect(start.mock.calls[1]?.[0]).toBe(start.mock.calls[0]?.[0]);
});

it('blocks overlapping garage operations before React publishes the busy state', async (): Promise<void> => {
    let completeStart: (run: Run) => void = (): void => {};

    const response = new Promise<Run>((resolve): void => {
        completeStart = resolve;
    });

    const start = vi.fn<typeof API.start>().mockReturnValue(response);
    const purchase = vi.fn<typeof API.purchase>().mockResolvedValue(PROGRESS);
    const selectStage = vi.fn<typeof API.selectStage>().mockResolvedValue(PROGRESS);
    const actions = new AppActions({ ...API, start, purchase, selectStage }, vi.fn());
    const state = garage();
    const first = actions.start(state);

    await actions.buy(state, 'engine');
    await actions.selectStage(state, 'industrial');

    const second = actions.start(state);

    completeStart(RUN);
    await Promise.all([ first, second ]);

    expect(start).toHaveBeenCalledTimes(1);
    expect(purchase).not.toHaveBeenCalled();
    expect(selectStage).not.toHaveBeenCalled();
});
