import { afterEach, expect, it, vi } from 'vitest';

import { API } from '../apps/web/src/api/client';
import { ApiError } from '../apps/web/src/api/ApiError';
import { AppActions } from '../apps/web/src/state/AppActions';
import { pendingResult } from '../apps/web/src/state/pendingResult';
import type { AppState } from '../apps/web/src/state/types';

import { PROGRESS, RUN, REPORT, storage, result } from './result-recovery.helpers';

afterEach((): void => {
    vi.unstubAllGlobals();
});

it.each([ 401, 404, 422, 502 ])('allows leaving a result only after a permanent HTTP rejection: %s', async (status): Promise<void> => {
    storage();

    const finish = vi.fn<typeof API.finish>().mockRejectedValue(new ApiError(status, 'Rejected'));
    const states: Array<AppState> = [];

    const actions = new AppActions({ ...API, finish }, (state): void => {
        states.push(state);
    });

    await actions.finish(RUN, REPORT);

    expect(finish).toHaveBeenCalledTimes(1);
    expect(result(states).canDiscard).toBe(status !== 502);
    expect(pendingResult.read()?.run.id).toBe(RUN.id);
});

it('returns to the current guest garage when the pending run belongs to another session', async (): Promise<void> => {
    storage();

    const finish = vi.fn<typeof API.finish>().mockRejectedValue(new ApiError(404, 'Run not found'));
    const session = vi.fn<typeof API.session>().mockResolvedValue({ ready: true });
    const progress = vi.fn<typeof API.progress>().mockResolvedValue(PROGRESS);
    const states: Array<AppState> = [];

    const actions = new AppActions({ ...API, finish, session, progress }, (state): void => {
        states.push(state);
    });

    await actions.finish(RUN, REPORT);
    await actions.discardResult(result(states));

    expect(states.at(-1)?.screen).toBe('garage');
    expect(pendingResult.read()).toBeNull();
});

it('abandons a rejected report only when the player chooses to leave', async (): Promise<void> => {
    storage();

    const finish = vi.fn<typeof API.finish>()
        .mockRejectedValueOnce(new ApiError(422, 'Invalid report'))
        .mockResolvedValue({ reward: 0, progress: PROGRESS });

    const session = vi.fn<typeof API.session>().mockResolvedValue({ ready: true });
    const progress = vi.fn<typeof API.progress>().mockResolvedValue(PROGRESS);
    const states: Array<AppState> = [];

    const actions = new AppActions({ ...API, finish, session, progress }, (state): void => {
        states.push(state);
    });

    await actions.finish(RUN, REPORT);

    expect(finish).toHaveBeenCalledTimes(1);

    await actions.discardResult(result(states));

    expect(finish.mock.calls[1]).toEqual([ RUN.id, {
        distance: 0, elapsedSeconds: 0, killedZombieIds: [], reason: 'abandon',
    } ]);

    expect(states.at(-1)?.screen).toBe('garage');
});

it('keeps the pending report if returning to the garage loses connection', async (): Promise<void> => {
    storage();

    const finish = vi.fn<typeof API.finish>().mockRejectedValue(new ApiError(404, 'Run not found'));
    const session = vi.fn<typeof API.session>().mockResolvedValue({ ready: true });
    const progress = vi.fn<typeof API.progress>().mockRejectedValue(new TypeError('Offline'));
    const states: Array<AppState> = [];

    const actions = new AppActions({ ...API, finish, session, progress }, (state): void => {
        states.push(state);
    });

    await actions.finish(RUN, REPORT);
    await actions.discardResult(result(states));

    expect(result(states).isBusy).toBe(false);
    expect(pendingResult.read()?.run.id).toBe(RUN.id);
});

it('sends only one report while settlement is pending', async (): Promise<void> => {
    storage();

    let complete: (value: Awaited<ReturnType<typeof API.finish>>) => void = (): void => {};

    const response = new Promise<Awaited<ReturnType<typeof API.finish>>>((resolve): void => {
        complete = resolve;
    });

    const finish = vi.fn<typeof API.finish>().mockReturnValue(response);
    const actions = new AppActions({ ...API, finish }, vi.fn());
    const first = actions.finish(RUN, REPORT);
    const second = actions.finish(RUN, REPORT);

    complete({ reward: 60, progress: PROGRESS });
    await Promise.all([ first, second ]);

    expect(finish).toHaveBeenCalledTimes(1);
});
