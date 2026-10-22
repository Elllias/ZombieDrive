import { Vec2 } from 'planck';
import { expect, it } from 'vitest';

import { GameSimulation } from '../apps/web/src/game/GameSimulation';

import { BASE_STATS, IDLE } from './physics.helpers';

function collisionScene(speed: number): GameSimulation {
    const game = new GameSimulation(BASE_STATS, {
        isFlat: true,
        spawns: [],
        crateSpawns: [ { id: 'target', x: 7, row: 0 } ],
    });

    game.car.bodies.forEach((body): void => body.setLinearVelocity(Vec2(speed, 0)));

    return game;
}

it('keeps a crate solid during a low-speed collision', (): void => {
    const game = collisionScene(2);
    const crate = game.crates.actors[0];

    if (!crate) {
        throw new Error('Missing test crate');
    }

    let hasContact = false;

    game.world.on('post-solve', (contact): void => {
        const bodies = [ contact.getFixtureA().getBody(), contact.getFixtureB().getBody() ];

        if (bodies.includes(crate.part.body) && bodies.some((body) => game.car.bodies.includes(body))) {
            hasContact = true;
        }
    });

    for (let step = 0; step < 120; step += 1) {
        game.step(IDLE);
    }

    expect(hasContact).toBe(true);
    expect(crate.isBroken).toBe(false);
    expect(game.crates.fragments).toHaveLength(0);
});

it.each([ 10, 30 ])('breaks once at %s m/s and reduces the speed of the car', (speed): void => {
    const game = collisionScene(speed);
    const control = new GameSimulation(BASE_STATS, { isFlat: true, spawns: [], crateSpawns: [] });

    control.car.bodies.forEach((body): void => body.setLinearVelocity(Vec2(speed, 0)));

    for (let step = 0; step < 120 && !game.crates.actors[0]?.isBroken; step += 1) {
        control.step(IDLE);
        game.step(IDLE);
    }

    expect(game.crates.actors[0]?.isBroken).toBe(true);
    expect(game.crates.fragments).toHaveLength(4);

    for (let step = 0; step < 6; step += 1) {
        control.step(IDLE);
        game.step(IDLE);
    }

    expect(game.car.chassis.getLinearVelocity().x).toBeLessThan(
        control.car.chassis.getLinearVelocity().x - 2,
    );

    expect(game.crates.fragments.some((fragment) => fragment.part.body.getLinearVelocity().x > 1)).toBe(true);
});

it('removes fragments after their lifetime without leaving physical bodies', (): void => {
    const game = collisionScene(10);

    for (let step = 0; step < 240; step += 1) {
        game.step(IDLE);
    }

    expect(game.crates.actors[0]?.isBroken).toBe(true);
    expect(game.crates.fragments).toHaveLength(0);
    expect(game.world.getBodyCount()).toBe(4);
});
