import { Vec2 } from 'planck';
import { expect, it } from 'vitest';

import { carStats, stageConfig, vehicleConfig } from '@zombie-drive/shared';

import { GameSimulation } from '../apps/web/src/game/GameSimulation';
import { vehicleStyles } from '../apps/web/src/ui/common/Vehicle.utils';

import { GAS, IDLE } from './physics.helpers';
import { slopeControls } from './level-controls.helpers';
import { r8Scene, driveThird, MAXIMUM_R8 } from './third-stage.helpers';
import { buttonControls } from './button-controls.helpers';

it('introduces the R8 on a longer, denser route without new hazard types', (): void => {
    const stage = stageConfig('pass');
    const base = driveThird(r8Scene(0), () => GAS);
    const medium = driveThird(r8Scene(3), buttonControls);

    expect(stage.track.length).toBeGreaterThan(stageConfig('industrial').track.length);
    expect(stage.zombies).toHaveLength(90);
    expect(stage.zombies.filter((zombie) => zombie.kind === 'heavy')).toHaveLength(36);
    expect(stage.crates).toHaveLength(100);
    expect(stage.barrels).toHaveLength(32);
    expect(base.rules.distance).toBeGreaterThan(150);
    expect(base.rules.distance).toBeLessThan(350);
    expect(medium.rules.distance).toBeGreaterThan(stage.track.length / 2);
    expect(medium.rules.distance).toBeLessThan(stage.track.length * 0.75);
});

it('requires steering even with maximum R8 upgrades', (): void => {
    const game = driveThird(r8Scene(5), () => GAS);

    expect(game.rules.reason).not.toBe('finish');
    expect(game.rules.distance).toBeGreaterThan(150);
    expect(game.rules.distance).toBeLessThan(stageConfig('pass').track.length);
});

it.each([ slopeControls, buttonControls ])('finishes using deliberate steering and a limited fuel reserve',
    (controls): void => {
        const game = driveThird(r8Scene(5), controls);

        expect(game.rules.reason).toBe('finish');
        expect(game.rules.distance).toBe(2400);
        expect(game.rules.elapsed).toBeGreaterThan(140);
        expect(game.rules.elapsed).toBeLessThan(165);
        expect(game.car.fuel).toBeGreaterThan(0);
        expect(game.car.fuel).toBeLessThan(20);
        expect(game.zombies.killed.size).toBe(90);
    });

it.each([ 0, 1, 2, 3, 4, 5 ])('matches garage and physical R8 wheels at tire level %i', (tires): void => {
    const stats = carStats({ ...MAXIMUM_R8, tires }, 'r8');
    const styles = vehicleStyles(tires, 'r8');
    const vehicle = vehicleConfig('r8');
    const game = new GameSimulation(stats, { isFlat: true, spawns: [], crateSpawns: [], barrelSpawns: [] });

    expect(game.car.wheels).toHaveLength(2);
    expect(stats.wheelRadius).toBeLessThan(0.4);

    styles.wheels.forEach((wheel, index): void => {
        const diameter = Number.parseFloat(String(wheel.width)) / 100 * vehicle.width;
        const center = Number.parseFloat(String(wheel.left)) / 100 * vehicle.width + diameter / 2;
        const offset = game.car.wheels[index]?.getPosition().x ?? 0;

        expect(diameter).toBeCloseTo(stats.wheelRadius * 2, 6);
        expect(center - vehicle.width / 2).toBeCloseTo(offset - game.car.chassis.getPosition().x, 6);
    });
});

it('protects actual frontal R8 contacts with its smaller vehicle-specific plow', (): void => {
    const speeds = [ 0, 1 ].map((plow) => {
        const game = new GameSimulation(carStats({ ...MAXIMUM_R8, plow }, 'r8'), {
            isFlat: true, crateSpawns: [], barrelSpawns: [], spawns: [ { id: 'heavy', x: 10, kind: 'heavy' } ],
        });

        game.car.bodies.forEach((body): void => body.setLinearVelocity(Vec2(15, 0)));

        while (game.zombies.killed.size === 0 && game.rules.elapsed < 2) {
            game.step(IDLE);
        }

        expect(game.zombies.killed.size).toBe(1);

        return game.car.chassis.getLinearVelocity().x;
    });

    expect(speeds[1]).toBeGreaterThan((speeds[0] ?? 0) + 2);
});
