import { Vec2 } from 'planck';
import { expect, it } from 'vitest';

import { simulation, IDLE } from './physics.helpers';

function airborneCar(): ReturnType<typeof simulation> {
    const game = simulation();

    game.car.bodies.forEach((body): void => {
        const position = body.getPosition();

        body.setTransform(Vec2(position.x, position.y - 120), body.getAngle());
    });

    return game;
}

it.each([ -1, 1 ])('can complete a full rotation in the air with tilt=%s', (tilt): void => {
    const game = airborneCar();

    for (let step = 0; step < 210; step += 1) {
        game.step({ ...IDLE, tilt });
    }

    expect(game.car.chassis.getAngle() * tilt).toBeGreaterThan(Math.PI * 2);
    expect(game.rules.reason).toBeNull();
});

it('does not count an airborne upside-down car as a failed rollover', (): void => {
    const game = airborneCar();

    invertCar(game, 120);

    for (let step = 0; step < 240; step += 1) {
        game.step(IDLE);
    }

    expect(game.car.isTouchingSurface()).toBe(false);
    expect(game.rules.reason).toBeNull();
});

it('ends a sustained rollover after the car lands on its roof', (): void => {
    const game = simulation();

    invertCar(game, 0);

    for (let step = 0; step < 300 && !game.rules.reason; step += 1) {
        game.step(IDLE);
    }

    expect(game.rules.reason).toBe('rollover');
});

it('can reverse angular motion after changing the tilt direction', (): void => {
    const game = airborneCar();

    for (let step = 0; step < 60; step += 1) {
        game.step({ ...IDLE, tilt: 1 });
    }

    expect(game.car.chassis.getAngularVelocity()).toBeGreaterThan(1.5);

    for (let step = 0; step < 60; step += 1) {
        game.step({ ...IDLE, tilt: -1 });
    }

    expect(game.car.chassis.getAngularVelocity()).toBeLessThan(-1);
});

function invertCar(game: ReturnType<typeof simulation>, height: number): void {
    const pivot = game.car.chassis.getPosition().clone();

    game.car.bodies.forEach((body): void => {
        const position = body.getPosition();

        body.setTransform(Vec2(pivot.x * 2 - position.x, pivot.y * 2 - position.y - height), Math.PI);
    });
}
