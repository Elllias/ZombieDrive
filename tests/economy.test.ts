import { expect, it } from 'vitest';

import { GAME_CONFIG } from '@zombie-drive/shared';

import { playEconomyCampaign } from './economy-campaign.helpers';

const CAMPAIGN_TEST_TIMEOUT_MS = 60000;

const STRATEGIES = [
    { name: 'balanced upgrades', weights: { engine: 1, tank: 1, tires: 1, suspension: 1 } },
    { name: 'engine and fuel first', weights: { engine: 1, tank: 0.9, tires: 1.35, suspension: 1.6 } },
];

it.each(STRATEGIES)('paces a fresh campaign with $name', ({ weights }): void => {
    const result = playEconomyCampaign(weights);
    const firstTierTotal = Object.values(GAME_CONFIG.economy.baseCosts.suv).reduce((sum, cost) => sum + cost, 0);

    expect(result.reason).toBe('finish');
    expect(result.seconds).toBeGreaterThan(15 * 60);
    expect(result.seconds).toBeLessThan(21 * 60);
    expect(result.attempts).toBeGreaterThanOrEqual(10);
    expect(result.attempts).toBeLessThanOrEqual(15);
    expect(result.firstUpgradeAttempt).toBeGreaterThan(0);
    expect(result.firstUpgradeAttempt).toBeLessThanOrEqual(2);
    expect(result.firstReward).toBeLessThan(firstTierTotal);
}, CAMPAIGN_TEST_TIMEOUT_MS);
