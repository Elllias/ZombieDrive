import { expect, it } from 'vitest';

import { CarStatsSchema, carStats } from '@zombie-drive/shared';

import { GameSimulation } from '../apps/web/src/game/GameSimulation';

import { IDLE } from './physics.helpers';

it('preserves geometry when reading a stored run from before wheel upgrades', (): void => {
    const old = CarStatsSchema.parse({
        driveTorque: 150,
        friction: 0.7,
        springFrequency: 3.6,
        springDamping: 0.75,
        fuelSeconds: 18,
    });

    expect(old).toMatchObject({ wheelRadius: 0.5, axleHeight: 0.7, tireLevel: 0 });
});

it('grows the actual wheel collider and raises the settled chassis at every tire level', (): void => {
    let previousRadius = 0;
    let previousHeight = Infinity;

    for (let tires = 0; tires <= 5; tires += 1) {
        const stats = carStats({ engine: 0, tank: 0, tires, suspension: 0 });
        const game = new GameSimulation(stats, { isFlat: true, spawns: [], crateSpawns: [] });

        for (let step = 0; step < 240; step += 1) {
            game.step(IDLE);
        }

        const wheel = game.car.parts[1];

        if (!wheel || wheel.shape.kind !== 'circle') {
            throw new Error('Missing test wheel');
        }

        const height = game.car.chassis.getPosition().y;

        expect(wheel.shape.radius).toBe(stats.wheelRadius);
        expect(stats.wheelRadius).toBeLessThanOrEqual(0.55);
        expect(stats.wheelRadius).toBeGreaterThan(previousRadius);
        expect(height).toBeLessThan(previousHeight);
        previousRadius = stats.wheelRadius;
        previousHeight = height;
    }
});
