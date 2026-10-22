import { randomUUID } from 'node:crypto';

import { afterEach, it, expect, vi } from 'vitest';

import { GAME_CONFIG, carStats, type Progress, type Run } from '@zombie-drive/shared';

import { API } from '../apps/web/src/api/client';
import { AppActions } from '../apps/web/src/state/AppActions';
import type { AppState } from '../apps/web/src/state/types';

const RUN: Run = {
    id: randomUUID(),
    configurationVersion: GAME_CONFIG.version,
    stats: carStats({ engine: 0, tank: 0, tires: 0, suspension: 0 }),
    expiresAt: new Date(Date.now() + 60000).toISOString(),
};

const PROGRESS: Progress = {
    balance: 0,
    bestDistance: 0,
    activeRun: null,
    upgrades: { engine: 0, tank: 0, tires: 0, suspension: 0 },
};

const REPORT = { distance: 20, elapsedSeconds: 4, killedZombieIds: [], reason: 'fuel' } as const;

afterEach((): void => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
});

function storage(): void {
    const entries = new Map<string, string>();

    vi.stubGlobal('localStorage', {
        getItem: (key: string) => entries.get(key) ?? null,
        setItem: (key: string, value: string) => entries.set(key, value),
        removeItem: (key: string) => entries.delete(key),
    });
}

it('allows a manual retry with the same report after automatic recovery fails', async (): Promise<void> => {
    storage();

    const finish = vi
        .fn<typeof API.finish>()
        .mockRejectedValueOnce(new TypeError('Lost response'))
        .mockRejectedValueOnce(new DOMException('Fetch is aborted', 'AbortError'))
        .mockResolvedValue({ reward: 60, progress: { ...PROGRESS, balance: 60 } });

    const states: Array<AppState> = [];

    const actions = new AppActions({ ...API, finish }, (state): void => {
        states.push(state);
    });

    const report = { ...REPORT, killedZombieIds: [] };

    await actions.finish(RUN, report);

    const pending = resultState(states);

    expect(pending?.screen).toBe('result');
    expect(pending.settlement).toBeNull();
    await actions.finish(RUN, report);

    expect(finish.mock.calls).toEqual([
        [ RUN.id, report ],
        [ RUN.id, report ],
        [ RUN.id, report ],
    ]);

    const final = resultState(states);

    expect(final.settlement?.reward).toBe(60);
});

function resultState(states: ReadonlyArray<AppState>): Extract<AppState, { screen: 'result' }> {
    const state = states.at(-1);

    if (state?.screen !== 'result') {
        throw new Error('Expected result');
    }

    return state;
}

it('confirms a result even when the device cannot access local storage', async (): Promise<void> => {
    const unavailable = (): never => {
        throw new Error('Storage unavailable');
    };

    vi.stubGlobal('localStorage', { getItem: unavailable, setItem: unavailable, removeItem: unavailable });
    vi.spyOn(console, 'error').mockImplementation((): undefined => undefined);

    const finish = vi.fn<typeof API.finish>().mockResolvedValue({ reward: 60, progress: PROGRESS });
    const states: Array<AppState> = [];

    await new AppActions({ ...API, finish }, (state): void => {
        states.push(state);
    }).finish(RUN, { ...REPORT, killedZombieIds: [] });

    const final = states.at(-1);

    if (final?.screen !== 'result') {
        throw new Error('Expected result');
    }

    expect(final.settlement?.reward).toBe(60);
    expect(final.error).toBeNull();
});

it('keeps the start key after a lost response', async (): Promise<void> => {
    const start = vi
        .fn<typeof API.start>()
        .mockRejectedValueOnce(new TypeError('Lost response'))
        .mockResolvedValue(RUN);

    const states: Array<AppState> = [];

    const actions = new AppActions({ ...API, start }, (state): void => {
        states.push(state);
    });

    const garage = { screen: 'garage', progress: PROGRESS, error: null, isBusy: false } satisfies AppState;

    await actions.start(garage);
    await actions.start(garage);
    expect(start.mock.calls[0]?.[0]).toBe(start.mock.calls[1]?.[0]);
    expect(states.at(-1)?.screen).toBe('run');
});
