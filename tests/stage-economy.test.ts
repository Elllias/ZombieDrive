import { expect, it } from 'vitest';

import { rulesSnapshot, stageConfig, upgradeCost, vehicleConfig, type StageId, type RunReport } from '@zombie-drive/shared';

import { runReward } from '../apps/api/src/domain/runReward';

const STAGE_REWARDS: ReadonlyArray<{ stageId: StageId; maximum: number }> = [
    { stageId: 'hills', maximum: 874 },
    { stageId: 'industrial', maximum: 96600 },
    { stageId: 'pass', maximum: 24480000 },
];

it.each(STAGE_REWARDS)('limits a perfect $stageId run to $maximum', ({ stageId, maximum }): void => {
    const stage = stageConfig(stageId);

    const report = {
        distance: stage.track.length,
        elapsedSeconds: 160,
        reason: 'finish',
        killedZombieIds: stage.zombies.map((spawn) => spawn.id),
    } as const;

    expect(runReward(report, rulesSnapshot(stageId))).toBe(maximum);
    expect(runReward({ ...report, reason: 'abandon' }, rulesSnapshot(stageId))).toBe(0);
});

it.each([
    { previousMaximum: 874, next: 'industrial' },
    { previousMaximum: 96600, next: 'pass' },
] as const)('makes a perfect previous run insufficient for even half a $next part',
    ({ previousMaximum, next }): void => {
        const vehicleId = stageConfig(next).vehicleId;
        const prices = vehicleConfig(vehicleId).upgrades.map((upgrade) => upgradeCost(upgrade, 0, vehicleId));

        expect(previousMaximum).toBeLessThan(Math.min(...prices) / 2);
    });

it('rounds fractional distance earnings down to whole currency', (): void => {
    const report: RunReport = { distance: 39.9, elapsedSeconds: 4, killedZombieIds: [ 'zombie-0' ], reason: 'fuel' };

    expect(runReward(report, rulesSnapshot('hills'))).toBe(15);
});
