import { Vec2 } from 'planck';
import { expect, it } from 'vitest';

import { GAME_CONFIG } from '@zombie-drive/shared';

import { GameSimulation } from '../apps/web/src/game/GameSimulation';

import { BASE_STATS, IDLE } from './physics.helpers';

it.each([ 10, 20, 30 ])('substantially slows the car on the first live zombie hit at %s m/s', (speed): void => {
    const game = new GameSimulation(BASE_STATS, {
        isFlat: true,
        spawns: [ { id: 'target', x: 7 } ],
        crateSpawns: [],
    });

    const control = new GameSimulation(BASE_STATS, { isFlat: true, spawns: [], crateSpawns: [] });

    [ game, control ].forEach((scene): void => {
        scene.car.bodies.forEach((body): void => body.setLinearVelocity(Vec2(speed, 0)));
    });

    for (let step = 0; step < 120 && game.zombies.killed.size === 0; step += 1) {
        control.step(IDLE);
        game.step(IDLE);
    }

    expect(game.zombies.killed.size).toBe(1);

    const loss = control.car.chassis.getLinearVelocity().x - game.car.chassis.getLinearVelocity().x;

    expect(loss).toBeGreaterThanOrEqual(2.9);

    game.zombies.actors[0]?.parts.forEach((part): void => {
        expect(part.body.getFixtureList()?.getFilterMaskBits()).toBe(GAME_CONFIG.collisions.ground);
        expect(part.body.getLinearVelocity().length()).toBeGreaterThan(1);
    });
});
