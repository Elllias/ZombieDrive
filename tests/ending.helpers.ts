import { carStats, stageConfig, type StageId } from '@zombie-drive/shared';

import type { ResultState } from '../apps/web/src/state/types';

export function endingResult(stageId: StageId = 'pass'): ResultState {
    return {
        screen: 'result',

        run: { id: 'd9f8c603-6f20-48f0-8fbf-0222066e572c',
            stageId,
            configurationVersion: 'test',
            expiresAt: '2026-10-22T00:00:00.000Z',
            stats: carStats({ engine: 5, tank: 5, tires: 5, suspension: 5 }, stageConfig(stageId).vehicleId) },

        report: { distance: stageConfig(stageId).track.length,
            elapsedSeconds: 160,
            reason: 'finish',
            killedZombieIds: [] },

        settlement: { reward: 100,

            progress: { stageId,
                balance: 100,
                bestDistance: stageConfig(stageId).track.length,
                upgrades: { engine: 5, tank: 5, tires: 5, suspension: 5 },
                activeRun: null,
                stages: [ { stageId, bestDistance: stageConfig(stageId).track.length, completed: true } ] } },

        isBusy: false,
        error: null,
        canDiscard: false,
    };
}
