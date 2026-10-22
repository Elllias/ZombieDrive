import { expect, it } from 'vitest';

import { stageConfig, vehicleConfig, upgradeCost, type StageId } from '@zombie-drive/shared';

import { playStageCampaign } from './stage-campaign.helpers';
import { buttonControls } from './button-controls.helpers';
import { slopeControls } from './level-controls.helpers';

const CAMPAIGN_TEST_TIMEOUT_MS = 120000;

const STRATEGIES = [
    { name: 'balanced upgrades and button steering',
        weights: { engine: 1, tank: 1, tires: 1, suspension: 1, plow: 0.2 },
        controls: buttonControls },

    { name: 'engine and tank first',
        weights: { engine: 1, tank: 0.9, tires: 1.35, suspension: 1.6, plow: 0.2 },
        controls: slopeControls },
];

it.each(STRATEGIES)('paces the R8 campaign with $name and actual carried funds', ({ weights, controls }): void => {
    const first = playStageCampaign('hills', 0, weights);
    const second = playStageCampaign('industrial', first.balance, weights);
    const third = playStageCampaign('pass', second.balance, weights, controls);

    expect(first.reason).toBe('finish');
    expect(second.reason).toBe('finish');
    expect(third.reason).toBe('finish');
    expectLimitedCarry(first.balance, 'industrial');
    expectLimitedCarry(second.balance, 'pass');
    expect(third.seconds).toBeGreaterThan(15 * 60);
    expect(third.seconds).toBeLessThan(20 * 60);
    expect(third.attempts).toBeGreaterThanOrEqual(7);
    expect(third.attempts).toBeLessThanOrEqual(16);
    expect(third.upgrades.tires).toBeLessThan(5);
    expect(third.upgrades.suspension).toBeLessThan(5);
}, CAMPAIGN_TEST_TIMEOUT_MS);

function expectLimitedCarry(balance: number, stageId: StageId): void {
    const vehicleId = stageConfig(stageId).vehicleId;
    const costs = vehicleConfig(vehicleId).upgrades.map((upgrade) => upgradeCost(upgrade, 0, vehicleId));

    expect(balance).toBeLessThan(Math.min(...costs));
}
