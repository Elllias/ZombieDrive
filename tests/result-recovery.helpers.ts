import { randomUUID } from 'node:crypto';

import { vi } from 'vitest';

import { GAME_CONFIG, carStats, type Progress, type Run, type RunReport } from '@zombie-drive/shared';

import type { AppState, ResultState } from '../apps/web/src/state/types';

export const PROGRESS: Progress = {
    balance: 0,
    bestDistance: 0,
    activeRun: null,
    upgrades: { engine: 0, tank: 0, tires: 0, suspension: 0 },
};

export const RUN: Run = {
    id: randomUUID(),
    configurationVersion: GAME_CONFIG.version,
    stats: carStats(PROGRESS.upgrades),
    expiresAt: new Date(Date.now() + 60000).toISOString(),
};

export const REPORT: RunReport = { distance: 20, elapsedSeconds: 4, killedZombieIds: [], reason: 'fuel' };

export function storage(): void {
    const entries = new Map<string, string>();

    vi.stubGlobal('localStorage', {
        getItem: (key: string) => entries.get(key) ?? null,
        setItem: (key: string, value: string) => entries.set(key, value),
        removeItem: (key: string) => entries.delete(key),
    });
}

export function result(states: ReadonlyArray<AppState>): ResultState {
    const state = states.at(-1);

    if (state?.screen !== 'result') {
        throw new Error('Expected a result state');
    }

    return state;
}
