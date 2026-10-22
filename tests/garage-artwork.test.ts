import { afterEach, expect, it, vi } from 'vitest';

import type { Progress } from '@zombie-drive/shared';

import { API } from '../apps/web/src/api/client';
import { AppActions } from '../apps/web/src/state/AppActions';
import type { GarageState, ResultState } from '../apps/web/src/state/types';

import { PROGRESS, RUN, REPORT, storage } from './result-recovery.helpers';
import { pendingArtwork } from './artwork.helpers';

const TRUCK: GarageState = { screen: 'garage',
    progress: { ...PROGRESS, stageId: 'industrial' },
    isBusy: false,
    error: null };

const AUDI: Progress = { ...PROGRESS, stageId: 'pass' };

afterEach((): void => {
    vi.unstubAllGlobals();
});

it('keeps the original garage and rejects overlapping changes until the next artwork is decoded', async (): Promise<void> => {
    const artwork = pendingArtwork();
    const prepare = vi.fn().mockReturnValue(artwork.ready);
    const selectStage = vi.fn<typeof API.selectStage>().mockResolvedValue(AUDI);
    const setState = vi.fn();
    const actions = new AppActions({ ...API, selectStage }, setState, prepare);
    const changing = actions.selectStage(TRUCK, 'pass');

    await vi.waitFor(() => expect(prepare).toHaveBeenCalledWith(AUDI));
    expect(setState).toHaveBeenLastCalledWith({ ...TRUCK, isBusy: true });
    await actions.selectStage(TRUCK, 'hills');
    expect(selectStage).toHaveBeenCalledTimes(1);
    artwork.complete();
    await changing;
    expect(setState).toHaveBeenLastCalledWith({ screen: 'garage', progress: AUDI, isBusy: false, error: null });
});

it.each([ true, false ])('prepares initial artwork and honours load cancellation: %s', async (isCancelled): Promise<void> => {
    storage();

    const artwork = pendingArtwork();
    const prepare = vi.fn().mockReturnValue(artwork.ready);
    const session = vi.fn<typeof API.session>().mockResolvedValue({ ready: true });
    const progress = vi.fn<typeof API.progress>().mockResolvedValue(AUDI);
    const setState = vi.fn();
    const actions = new AppActions({ ...API, session, progress }, setState, prepare);
    let isCurrent = true;
    const loading = actions.load(() => isCurrent);

    await vi.waitFor(() => expect(prepare).toHaveBeenCalledWith(AUDI));
    expect(setState).toHaveBeenLastCalledWith({ screen: 'loading' });
    isCurrent = !isCancelled;
    artwork.complete();
    await loading;
    expect(setState.mock.calls.at(-1)?.[0].screen).toBe(isCancelled ? 'loading' : 'garage');
});

it('retains a confirmed purchase key when artwork fails, so retrying cannot charge twice', async (): Promise<void> => {
    const updated = { ...AUDI, balance: 70, upgrades: { ...AUDI.upgrades, tires: 1 } };
    const purchase = vi.fn<typeof API.purchase>().mockResolvedValue(updated);
    const prepare = vi.fn().mockRejectedValueOnce(new Error('Image offline')).mockResolvedValue(undefined);
    const setState = vi.fn();
    const actions = new AppActions({ ...API, purchase }, setState, prepare);
    const original = { ...TRUCK, progress: AUDI };

    await actions.buy(original, 'tires');

    expect(setState).toHaveBeenLastCalledWith({ ...original, error: 'Image offline' });
    await actions.buy(original, 'tires');
    expect(purchase.mock.calls[1]?.[0]).toEqual(purchase.mock.calls[0]?.[0]);
    expect(setState).toHaveBeenLastCalledWith({ screen: 'garage', progress: updated, isBusy: false, error: null });
});

it('keeps a saved result visible if garage artwork fails and retries without another settlement', async (): Promise<void> => {
    const state: ResultState = { screen: 'result',
        run: RUN,
        report: REPORT,
        settlement: { reward: 60, progress: AUDI },
        isBusy: false,
        error: null,
        canDiscard: false };

    const finish = vi.fn<typeof API.finish>();
    const prepare = vi.fn().mockRejectedValueOnce(new Error('Image offline')).mockResolvedValue(undefined);
    const setState = vi.fn();
    const actions = new AppActions({ ...API, finish }, setState, prepare);

    await actions.garage(state);

    expect(setState).toHaveBeenLastCalledWith({ ...state, error: 'Image offline' });
    await actions.garage(state);
    expect(finish).not.toHaveBeenCalled();
    expect(setState).toHaveBeenLastCalledWith({ screen: 'garage', progress: AUDI, isBusy: false, error: null });
});

it('preserves a failed start key when a purchase only changes the garage artwork', async (): Promise<void> => {
    const start = vi.fn<typeof API.start>().mockRejectedValue(new Error('Network interrupted'));
    const purchase = vi.fn<typeof API.purchase>().mockResolvedValue(AUDI);
    const prepare = vi.fn().mockResolvedValue(undefined);
    const actions = new AppActions({ ...API, start, purchase }, vi.fn(), prepare);

    await actions.start(TRUCK);
    await actions.buy(TRUCK, 'tires');
    await actions.start(TRUCK);
    expect(start.mock.calls[1]?.[0]).toBe(start.mock.calls[0]?.[0]);
});
