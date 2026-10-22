import { expect, it } from 'vitest';

import { carStats, stageConfig, vehicleConfig } from '@zombie-drive/shared';

import { GameSimulation } from '../apps/web/src/game/GameSimulation';
import { vehicleStyles } from '../apps/web/src/ui/common/Vehicle.utils';

import { slopeControls } from './level-controls.helpers';

it('makes the base truck need upgrades and keeps the full route reachable with a maximum tank', (): void => {
    const results = [ 0, 5 ].map((level) => {
        const game = new GameSimulation(carStats({ engine: level,
            tank: level,
            tires: level,
            suspension: level,
            plow: Number(level > 0) }, 'truck'));

        while (!game.rules.reason && game.rules.elapsed < 240) {
            game.step(slopeControls(game));
        }

        return game;
    });

    const base = results[0];
    const maximum = results[1];

    expect(base?.rules.distance).toBeLessThan(stageConfig('industrial').track.length / 4);
    expect(maximum?.rules.reason).toBe('finish');
    expect(maximum?.rules.elapsed).toBeGreaterThan(120);
    expect(maximum?.rules.elapsed).toBeLessThan(165);
    expect(maximum?.car.fuel).toBeGreaterThan(5);
});

it('uses three physical axles and identical garage geometry at every tire tier', (): void => {
    const vehicle = vehicleConfig('truck');

    for (let level = 0; level <= 5; level++) {
        const stats = carStats({ engine: 0, tank: 0, tires: level, suspension: 0 }, 'truck');
        const styles = vehicleStyles(level, 'truck');

        expect(styles.wheels).toHaveLength(3);

        styles.wheels.forEach((wheel, index): void => {
            const diameter = Number.parseFloat(String(wheel.width)) / 100 * vehicle.width;
            const center = Number.parseFloat(String(wheel.left)) / 100 * vehicle.width + diameter / 2;

            expect(diameter).toBeCloseTo(stats.wheelRadius * 2, 6);
            expect(center - vehicle.width / 2).toBeCloseTo(vehicle.axles[index] ?? 0, 6);
        });
    }
},
);
