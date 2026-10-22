import { afterEach, expect, it, vi } from 'vitest';

import { API } from '../apps/web/src/api/client';
import { AppActions } from '../apps/web/src/state/AppActions';
import { pendingResult } from '../apps/web/src/state/pendingResult';
import type { AppState } from '../apps/web/src/state/types';

import { PROGRESS, RUN, REPORT, storage, result } from './result-recovery.helpers';

afterEach((): void => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
});

it.each([
    new DOMException('Fetch is aborted', 'AbortError'),
    new DOMException('Request timed out', 'TimeoutError'),
    new TypeError('Failed to fetch'),
])(
    'recovers a $name while delivering the same stored report', async (error): Promise<void> => {
        storage();
        vi.useFakeTimers();

        const fetch = vi.fn<typeof globalThis.fetch>()
            .mockRejectedValueOnce(error)
            .mockResolvedValueOnce(Response.json({ reward: 60, progress: PROGRESS }));

        vi.stubGlobal('fetch', fetch);

        const states: Array<AppState> = [];
        const actions = new AppActions(API, (state): number => states.push(state));
        const delivery = actions.finish(RUN, REPORT);

        expect(pendingResult.read()).toEqual({ run: RUN, report: REPORT });
        await vi.runAllTimersAsync();
        await delivery;

        expect(fetch).toHaveBeenCalledTimes(2);
        expect(fetch.mock.calls[1]?.[0]).toBe(`/api/runs/${ RUN.id }/finish`);
        expect(fetch.mock.calls[1]?.[1]?.body).toBe(JSON.stringify(REPORT));
        expect(result(states).settlement?.reward).toBe(60);
        expect(pendingResult.read()).toBeNull();
    },
);

it('keeps the report and shows a readable error after two aborted requests', async (): Promise<void> => {
    storage();
    vi.useFakeTimers();

    const finish = vi.fn<typeof API.finish>().mockRejectedValue(new DOMException('Fetch is aborted', 'AbortError'));
    const states: Array<AppState> = [];
    const actions = new AppActions({ ...API, finish }, (state): number => states.push(state));
    const delivery = actions.finish(RUN, REPORT);

    await vi.runAllTimersAsync();
    await delivery;

    expect(finish).toHaveBeenCalledTimes(2);
    expect(pendingResult.read()).toEqual({ run: RUN, report: REPORT });
    expect(result(states)).toMatchObject({ settlement: null, isBusy: false, canDiscard: false });
    expect(result(states).error).toBe('Нет связи с сервером. Проверьте подключение и повторите попытку.');
});

it('blocks another completion while waiting for the automatic retry', async (): Promise<void> => {
    storage();
    vi.useFakeTimers();

    const finish = vi.fn<typeof API.finish>()
        .mockRejectedValueOnce(new DOMException('Fetch is aborted', 'AbortError'))
        .mockResolvedValueOnce({ reward: 60, progress: PROGRESS });

    const actions = new AppActions({ ...API, finish }, vi.fn());
    const delivery = actions.finish(RUN, REPORT);

    await vi.advanceTimersByTimeAsync(0);
    await actions.finish(RUN, REPORT);
    expect(finish).toHaveBeenCalledTimes(1);
    await vi.runAllTimersAsync();
    await delivery;
    expect(finish).toHaveBeenCalledTimes(2);
});
