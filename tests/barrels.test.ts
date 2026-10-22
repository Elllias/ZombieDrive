import { Vec2 } from 'planck';
import { expect, it } from 'vitest';

import { IDLE } from './physics.helpers';
import { truckScene } from './second-stage.helpers';

it('does not detonate from resting weight or a gentle crate touch', (): void => {
    const game = truckScene({ barrelSpawns: [ { id: 'barrel', x: 14, row: 0 } ],
        crateSpawns: [ { id: 'crate', x: 12.8, row: 0 } ] });

    game.crates.actors[0]?.part.body.setLinearVelocity(Vec2(1, 0));

    for (let step = 0; step < 180; step++) {
        game.step(IDLE);
    }

    expect(game.barrels.actors[0]?.isExploded).toBe(false);
    expect(game.barrels.explosions).toHaveLength(0);
});

it('detonates from a crate impact without any contact with the car and chains once', (): void => {
    const game = truckScene({ barrelSpawns: [
        { id: 'first', x: 14, row: 0 }, { id: 'second', x: 15.3, row: 0 },
    ],

    crateSpawns: [ { id: 'crate', x: 12.5, row: 0 } ] });

    game.crates.actors[0]?.part.body.setLinearVelocity(Vec2(12, 0));

    for (let step = 0; step < 30; step++) {
        game.step(IDLE);
    }

    expect(game.barrels.actors.every((actor) => actor.isExploded)).toBe(true);
    expect(game.barrels.explosions).toHaveLength(2);
    expect(game.crates.actors[0]?.isBroken).toBe(true);

    for (let step = 0; step < 90; step++) {
        game.step(IDLE);
    }

    expect(game.barrels.explosions).toHaveLength(0);
    expect(game.barrels.parts).toHaveLength(0);
});

it('detonates on a hard fall onto terrain', (): void => {
    const game = truckScene({ barrelSpawns: [ { id: 'falling', x: 14, row: 0 } ] });
    const body = game.barrels.actors[0]?.part.body;

    body?.setPosition(Vec2(14, 3));
    body?.setLinearVelocity(Vec2(0, 8));

    for (let step = 0; step < 60; step++) {
        game.step(IDLE);
    }

    expect(game.barrels.actors[0]?.isExploded).toBe(true);
});

it('throws nearby actors, kills zombies once and lets the corpse fall onto terrain', (): void => {
    const game = truckScene({ barrelSpawns: [ { id: 'barrel', x: 14, row: 0 } ],
        crateSpawns: [ { id: 'crate', x: 12.5, row: 0 } ],
        spawns: [ { id: 'heavy', x: 16, kind: 'heavy' } ] });

    game.zombies.beforeStep({ left: 0, right: 25, top: 0, bottom: 10 }, game.car.parts);
    game.crates.actors[0]?.part.body.setLinearVelocity(Vec2(12, 0));

    for (let step = 0; step < 30; step++) {
        game.step(IDLE);
    }

    expect(game.zombies.killed).toEqual(new Set([ 'heavy' ]));
    expect(game.zombies.actors[0]?.parts).toHaveLength(6);
    expect(game.zombies.actors[0]?.parts.some((part) => part.body.getLinearVelocity().length() > 1)).toBe(true);
});
