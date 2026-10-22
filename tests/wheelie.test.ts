import { Vec2 } from 'planck';
import { expect, it } from 'vitest';

import { carStats, GAME_CONFIG } from '@zombie-drive/shared';

import { GameSimulation } from '../apps/web/src/game/GameSimulation';

import { GAS, IDLE } from './physics.helpers';

it.each([ 0, 5 ])('holds a wheelie on a flat road without overturning at upgrade level %s', (level): void => {
    const game = new GameSimulation(
        carStats({ engine: level, tank: level, tires: level, suspension: level }),
        { isFlat: true, spawns: [], crateSpawns: [] },
    );

    for (let step = 0; step < 150; step += 1) {
        game.step(GAS);
    }

    for (let step = 0; step < 180; step += 1) {
        game.step({ ...GAS, tilt: -1 });
    }

    const front = game.car.wheels[1];

    if (!front) {
        throw new Error('Missing front wheel');
    }

    expect(game.car.chassis.getAngle()).toBeLessThan(-0.3);
    expect(game.car.chassis.getAngle()).toBeGreaterThan(-0.7);

    expect(GAME_CONFIG.track.floorY - front.getPosition().y - game.car.stats.wheelRadius).toBeGreaterThan(
        0.5,
    );

    expect(game.car.isGrounded()).toBe(true);
    expect(game.rules.reason).toBeNull();
});

it.each([ -1, 1 ])('keeps a short air tap controlled and brakes after releasing tilt=%s', (tilt): void => {
    const game = new GameSimulation(carStats({ engine: 5, tank: 5, tires: 5, suspension: 5 }), {
        isFlat: true,
        spawns: [],
        crateSpawns: [],
    });

    game.car.bodies.forEach((body): void => {
        const position = body.getPosition();

        body.setPosition(Vec2(position.x, position.y - 120));
    });

    for (let step = 0; step < 12; step += 1) {
        game.step({ ...IDLE, tilt });
    }

    expect(Math.abs(game.car.chassis.getAngle())).toBeLessThan(0.25);

    for (let step = 0; step < 30; step += 1) {
        game.step(IDLE);
    }

    expect(Math.abs(game.car.chassis.getAngularVelocity())).toBeLessThan(0.2);
    expect(Math.abs(game.car.chassis.getAngle())).toBeLessThan(0.45);
});
