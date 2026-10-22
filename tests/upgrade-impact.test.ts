import { expect, it } from 'vitest';

import { sectionCar } from './upgrade-car.helpers';
import { driveSection } from './upgrade-section.helpers';
import { slopeControls } from './level-controls.helpers';
import { GAS } from './physics.helpers';

function climb(tires: number): ReturnType<typeof driveSection> {
    const game = sectionCar({ tires, suspension: 5, start: 137, speed: 0 });
    const metrics = driveSection(game, 154, slopeControls);

    expect(game.rules.reason).toBeNull();
    expect(game.car.chassis.getPosition().x).toBeGreaterThanOrEqual(154);

    return metrics;
}

it('climbs the loose hill much faster with better tires on the same engine', (): void => {
    const base = climb(0);
    const upgraded = climb(5);

    expect(upgraded.elapsed).toBeLessThan(base.elapsed * 0.65);
    expect(upgraded.slipRatio).toBeLessThan(base.slipRatio * 0.5);
});

it('reduces the time spent spinning wheels at every tire tier', (): void => {
    const tiers = [ 0, 1, 2, 3, 4, 5 ].map(climb);

    tiers.forEach((metrics, index): void => {
        const previous = tiers[index - 1];

        if (previous) {
            expect(metrics.elapsed).toBeLessThan(previous.elapsed);
            expect(metrics.slipRatio).toBeLessThan(previous.slipRatio);
        }
    });
});

it('reduces rocking and preserves more exit speed over the first rough section', (): void => {
    const base = sectionCar({ tires: 5, suspension: 0, start: 171, speed: 12 });
    const upgraded = sectionCar({ tires: 5, suspension: 5, start: 171, speed: 12 });
    const baseMetrics = driveSection(base, 211, () => GAS);
    const upgradedMetrics = driveSection(upgraded, 211, () => GAS);

    expect(base.rules.reason).toBeNull();
    expect(upgraded.rules.reason).toBeNull();
    expect(upgradedMetrics.rotation).toBeLessThan(baseMetrics.rotation * 0.8);
    expect(upgradedMetrics.speed).toBeGreaterThan(baseMetrics.speed * 1.03);
});
