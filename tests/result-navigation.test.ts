import { expect, it, vi } from 'vitest';

import { STAGE_IDS, type Progress, type StageId, type RunReport } from '@zombie-drive/shared';

import { API } from '../apps/web/src/api/client';
import { AppActions } from '../apps/web/src/state/AppActions';
import type { ResultState } from '../apps/web/src/state/types';

import { PROGRESS, RUN, REPORT } from './result-recovery.helpers';

function finished(stageId: StageId = 'hills', reason: RunReport['reason'] = 'finish'): ResultState {
    return {
        screen: 'result',
        run: { ...RUN, stageId },
        report: { ...REPORT, reason },

        settlement: { reward: 100,

            progress: {
                ...PROGRESS,
                stageId,
                stages: STAGE_IDS.map((id) => ({ stageId: id, bestDistance: 0, completed: id === stageId })),
            } },

        isBusy: false,
        canDiscard: false,
        error: null,
    };
}

it.each([
    { stageId: 'hills', next: 'industrial' },
    { stageId: 'industrial', next: 'pass' },
] as const)('opens the $next garage with the ordinary garage action after $stageId',
    async ({ stageId, next }): Promise<void> => {
        const progress = { ...PROGRESS, stageId: next };
        const selectStage = vi.fn<typeof API.selectStage>().mockResolvedValue(progress);
        const setState = vi.fn();
        const actions = new AppActions({ ...API, selectStage }, setState);

        await actions.garage(finished(stageId));

        expect(selectStage).toHaveBeenCalledExactlyOnceWith(next);
        expect(setState).toHaveBeenLastCalledWith({ screen: 'garage', progress, isBusy: false, error: null });
    });

it.each([ 'fuel', 'rollover', 'stuck', 'timeout', 'abandon' ] as const)(
    'keeps the current garage for %s', async (reason): Promise<void> => {
        const selectStage = vi.fn<typeof API.selectStage>();
        const setState = vi.fn();
        const state = finished('industrial', reason);

        await new AppActions({ ...API, selectStage }, setState).garage(state);

        expect(selectStage).not.toHaveBeenCalled();

        expect(setState).toHaveBeenLastCalledWith({
            screen: 'garage', progress: state.settlement?.progress, isBusy: false, error: null,
        });
    });

it('opens the final garage after the final finish', async (): Promise<void> => {
    const selectStage = vi.fn<typeof API.selectStage>();
    const setState = vi.fn();
    const state = finished('pass');

    await new AppActions({ ...API, selectStage }, setState).garage(state);

    expect(selectStage).not.toHaveBeenCalled();

    expect(setState).toHaveBeenLastCalledWith({
        screen: 'garage', progress: state.settlement?.progress, isBusy: false, error: null,
    });
});

it('does not select a locked stage after an expired finish', async (): Promise<void> => {
    const state = finished();
    const progress: Progress = { ...PROGRESS, stages: [ { stageId: 'hills', bestDistance: 0, completed: false } ] };
    const selectStage = vi.fn<typeof API.selectStage>();
    const setState = vi.fn();

    await new AppActions({ ...API, selectStage }, setState).garage({ ...state, settlement: { reward: 0, progress } });

    expect(selectStage).not.toHaveBeenCalled();
    expect(setState).toHaveBeenLastCalledWith({ screen: 'garage', progress, isBusy: false, error: null });
});

it('keeps a saved result on a network error so the same garage button can retry', async (): Promise<void> => {
    const progress: Progress = { ...PROGRESS, stageId: 'industrial' };

    const selectStage = vi.fn<typeof API.selectStage>()
        .mockRejectedValueOnce(new Error('Offline')).mockResolvedValue(progress);

    const finish = vi.fn<typeof API.finish>();
    const setState = vi.fn();
    const actions = new AppActions({ ...API, selectStage, finish }, setState);
    const state = finished();

    await actions.garage(state);

    expect(setState).toHaveBeenLastCalledWith({ ...state, isBusy: false, error: 'Offline' });
    await actions.garage(state);
    expect(selectStage).toHaveBeenCalledTimes(2);
    expect(setState).toHaveBeenLastCalledWith({ screen: 'garage', progress, isBusy: false, error: null });
    expect(finish).not.toHaveBeenCalled();
});

it('blocks duplicate garage clicks and navigation before settlement', async (): Promise<void> => {
    let complete: (progress: Progress) => void = (): void => {};

    const response = new Promise<Progress>((resolve): void => {
        complete = resolve;
    });

    const selectStage = vi.fn<typeof API.selectStage>().mockReturnValue(response);
    const actions = new AppActions({ ...API, selectStage }, vi.fn());
    const state = finished();

    await actions.garage({ ...state, settlement: null });
    await actions.garage({ ...state, isBusy: true });
    expect(selectStage).not.toHaveBeenCalled();

    const pending = actions.garage(state);

    await actions.garage(state);
    expect(selectStage).toHaveBeenCalledTimes(1);
    complete({ ...PROGRESS, stageId: 'industrial' });
    await pending;
});
