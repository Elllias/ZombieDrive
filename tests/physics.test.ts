import { Vec2 } from 'planck';
import { it, expect } from 'vitest';

import { GAME_CONFIG } from '@zombie-drive/shared';

import { FixedStep } from '../apps/web/src/game/physics/FixedStep';
import { createRagdoll } from '../apps/web/src/game/zombies/createRagdoll';
import { GameBridge } from '../apps/web/src/game/GameBridge';

import type { Zombie } from '../apps/web/src/game/zombies/types';

import { simulation, drive, GAS, IDLE } from './physics.helpers';

it('drives with physical wheels and consumes fuel', (): void => {
    const game = simulation();

    drive(game, { seconds: 5 });
    expect(game.rules.distance).toBeGreaterThan(8);
    expect(game.car.fuel).toBeCloseTo(game.car.stats.fuelSeconds - 5, 2);
    expect(game.car.chassis.getPosition().y).toBeLessThan(GAME_CONFIG.track.floorY);
});

it('has the same movement and fuel at 30, 60 and 120 render frames per second', (): void => {
    const games = [ 30, 60, 120 ].map((fps) => {
        const game = simulation();

        drive(game, { seconds: 5, fps });

        return game;
    });

    const distances = games.map((game) => game.rules.distance);

    expect(Math.max(...distances) - Math.min(...distances)).toBeLessThan(0.05);

    const fuels = games.map((game) => game.car.fuel);

    expect(Math.max(...fuels) - Math.min(...fuels)).toBeLessThan(0.02);
});

it('limits catch-up after a long blocked frame', (): void => {
    const clock = new FixedStep();
    let steps = 0;

    clock.advance(10000, (): void => {
        steps += 1;
    });

    expect(steps).toBe(GAME_CONFIG.world.maxSteps);
    clock.reset();

    clock.advance(0, (): void => {
        steps += 1;
    });

    expect(steps).toBe(GAME_CONFIG.world.maxSteps);
});

it('starts pursuit only on entering the visible camera bounds', (): void => {
    const game = simulation([ { id: 'waiting', x: 25 } ]);
    const actor = game.zombies.actors[0];

    if (!actor) {
        throw new Error('Missing test zombie');
    }

    game.zombies.beforeStep({ left: 0, right: 10, top: 0, bottom: 10 }, game.car.parts);
    expect(actor.state).toBe('waiting');
    game.zombies.beforeStep({ left: 20, right: 30, top: 0, bottom: 10 }, game.car.parts);
    expect(actor.state).toBe('walking');
    game.zombies.beforeStep({ left: 0, right: 10, top: 0, bottom: 10 }, game.car.parts);
    expect(actor.state).toBe('walking');
});

it('slows the car on the first live collision and creates one dead ragdoll', (): void => {
    const control = simulation();
    const game = simulation([ { id: 'target', x: 12 } ]);

    for (let step = 0; step < 600 && game.zombies.killed.size === 0; step += 1) {
        control.step(GAS);
        game.step(GAS);
    }

    expect(game.zombies.killed.size).toBe(1);
    expect(game.zombies.actors[0]?.parts.length).toBe(6);
    expect(game.car.chassis.getLinearVelocity().x).toBeLessThan(control.car.chassis.getLinearVelocity().x);
    drive(game, { seconds: 3 });
    expect(game.zombies.killed.size).toBe(1);
});

it('passes through an existing corpse without changing the movement of either', (): void => {
    const control = simulation();
    const resting = simulation([ { id: 'resting', x: 10 } ]);
    const game = simulation([ { id: 'corpse', x: 10 } ]);
    const actor = game.zombies.actors[0];
    const reference = resting.zombies.actors[0];

    if (!actor || !reference) {
        throw new Error('Missing test zombies');
    }

    createRagdoll(game.world, actor);
    createRagdoll(resting.world, reference);
    drive(control, { seconds: 4 });
    drive(game, { seconds: 4 });

    for (let step = 0; step < 240; step += 1) {
        resting.step(IDLE);
    }

    expect(game.car.chassis.getPosition().x).toBeCloseTo(control.car.chassis.getPosition().x, 7);
    expectSameCorpse(actor, reference);
    expect(actor.state).toBe('ragdoll');
});

function expectSameCorpse(actor: Zombie, reference: Zombie): void {
    actor.parts.forEach((part, index): void => {
        const other = reference.parts[index];

        if (!other) {
            throw new Error('Missing reference body part');
        }

        expect(part.body.getPosition().x).toBeCloseTo(other.body.getPosition().x, 7);
        expect(part.body.getPosition().y).toBeCloseTo(other.body.getPosition().y, 7);
        expect(part.body.getAngle()).toBeCloseTo(other.body.getAngle(), 7);
    });
}

it('detects live collisions at high speed', (): void => {
    const game = simulation([ { id: 'fast-contact', x: 8 } ]);

    game.car.bodies.forEach((body): void => body.setLinearVelocity(Vec2(30, 0)));

    for (let step = 0; step < 20; step += 1) {
        game.step(IDLE);
    }

    expect(game.zombies.killed.has('fast-contact')).toBe(true);
});

it('clears held controls on pause and requires an explicit resume', (): void => {
    const bridge = new GameBridge();

    bridge.controls = GAS;
    bridge.pause();
    expect(bridge.controls).toEqual(IDLE);
    expect(bridge.getSnapshot().isPaused).toBe(true);
    bridge.resume();
    expect(bridge.getSnapshot().isPaused).toBe(false);
});

it('keeps a failed viewport paused even if keyboard input attempts to resume it', (): void => {
    const bridge = new GameBridge();

    bridge.controls = { gas: true, brake: false, tilt: 1 };
    bridge.pauseForError();
    bridge.resume();

    expect(bridge.getSnapshot().isPaused).toBe(true);
    expect(bridge.controls).toEqual({ gas: false, brake: false, tilt: 0 });

    bridge.abandon();

    expect(bridge.getSnapshot().report?.reason).toBe('abandon');
});
