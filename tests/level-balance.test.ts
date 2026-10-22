import { expect, it } from 'vitest';

import { carStats, GAME_CONFIG } from '@zombie-drive/shared';

import { GameSimulation } from '../apps/web/src/game/GameSimulation';

import { GAS } from './physics.helpers';
import { slopeControls } from './level-controls.helpers';
import { buttonControls } from './button-controls.helpers';

function maximumCar(): GameSimulation {
    return new GameSimulation(carStats({ engine: 5, tank: 5, tires: 5, suspension: 5 }));
}

it('does not finish the difficult level by holding gas alone, even with maximum upgrades', (): void => {
    const game = maximumCar();

    for (let step = 0; step < 14400 && !game.rules.reason; step += 1) {
        game.step(GAS);
    }

    expect([ 'fuel', 'rollover', 'stuck', 'timeout' ]).toContain(game.rules.reason);
    expect(game.rules.distance).toBeLessThan(GAME_CONFIG.track.length);
    expect(game.rules.distance).toBeGreaterThan(200);
});

it('finishes with button steering, limited fuel and broken obstacles', (): void => {
    const game = maximumCar();

    for (let step = 0; step < 14400 && !game.rules.reason; step += 1) {
        game.step(buttonControls(game));
    }

    expect(game.rules.reason).toBe('finish');
    expect(game.rules.distance).toBe(GAME_CONFIG.track.length);
    expect(game.rules.elapsed).toBeGreaterThan(140);
    expect(game.rules.elapsed).toBeLessThan(158);
    expect(game.car.fuel).toBeGreaterThan(0);
    expect(game.car.fuel).toBeLessThan(18);
    expect(game.zombies.killed.size).toBeGreaterThan(75);
    expect(game.crates.actors.every((crate) => crate.isBroken)).toBe(true);
});

it('requires another run-up after losing momentum on the steep first pit exit', (): void => {
    const game = maximumCar();

    for (let step = 0; step < 9000 && game.car.chassis.getPosition().x < 459; step += 1) {
        game.step(slopeControls(game));
    }

    for (let step = 0; step < 120 && game.car.chassis.getLinearVelocity().x > 0.6; step += 1) {
        game.step(slopeControls(game, false, true));
    }

    const stoppedX = game.car.chassis.getPosition().x;

    for (let step = 0; step < 240; step += 1) {
        game.step(slopeControls(game));
    }

    expect(game.car.chassis.getPosition().x).toBeLessThan(stoppedX);

    for (let step = 0; step < 240; step += 1) {
        game.step(slopeControls(game, false, true));
    }

    expect(game.car.chassis.getPosition().x).toBeLessThan(445);

    for (let step = 0; step < 900 && game.car.chassis.getPosition().x < 480; step += 1) {
        game.step(slopeControls(game));
    }

    expect(game.rules.reason).toBeNull();
    expect(game.car.chassis.getPosition().x).toBeGreaterThanOrEqual(480);
});

it('can finish with continuous tilt inputs and a small fuel reserve', (): void => {
    const game = maximumCar();

    for (let step = 0; step < 14400 && !game.rules.reason; step += 1) {
        game.step(slopeControls(game));
    }

    expect(game.rules.reason).toBe('finish');
    expect(game.rules.distance).toBe(GAME_CONFIG.track.length);
    expect(game.car.fuel).toBeGreaterThan(0);
    expect(game.car.fuel).toBeLessThan(18);
});
