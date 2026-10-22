import { expect, it } from 'vitest';

import { carStats, GAME_CONFIG } from '@zombie-drive/shared';

import { GameSimulation } from '../apps/web/src/game/GameSimulation';

import { IDLE } from './physics.helpers';
import { landingMetrics } from './landing.helpers';

function settledCar(suspension: number): GameSimulation {
    const stats = carStats({ engine: 0, tank: 0, tires: 0, suspension });
    const game = new GameSimulation(stats, { isFlat: true, spawns: [] });

    for (let step = 0; step < 240; step += 1) {
        game.step(IDLE);
    }

    return game;
}

it.each([ 0, 5 ])('keeps clearance after the suspension settles at level %s', (level): void => {
    const game = settledCar(level);
    const chassis = game.car.chassis;
    const clearance = GAME_CONFIG.track.floorY - chassis.getPosition().y - GAME_CONFIG.car.chassisHalfHeight;

    expect(clearance).toBeGreaterThan(0.7);

    game.car.wheels.forEach((wheel): void => {
        const axle = chassis.getLocalPoint(wheel.getPosition());

        expect(axle.y).toBeGreaterThan(0.55);
        expect(wheel.getPosition().y + GAME_CONFIG.car.wheelRadius).toBeCloseTo(GAME_CONFIG.track.floorY, 1);
    });
});

it('reduces spring compression when the suspension is upgraded', (): void => {
    const base = settledCar(0).car;
    const upgraded = settledCar(5).car;

    expect(springCompression(upgraded)).toBeLessThan(springCompression(base) * 0.6);
});

it('stops repeated bounces and rocking much sooner after the same landing', (): void => {
    const base = landingMetrics(0);
    const upgraded = landingMetrics(5);

    expect(base.hasLanded).toBe(true);
    expect(upgraded.hasLanded).toBe(true);
    expect(upgraded.airborneSeconds).toBeLessThan(base.airborneSeconds * 0.35);
    expect(upgraded.verticalMotion).toBeLessThan(base.verticalMotion * 0.35);
    expect(upgraded.rotation).toBeLessThan(base.rotation * 0.25);
});

function springCompression(car: GameSimulation['car']): number {
    const wheel = car.wheels[0];

    if (!wheel) {
        throw new Error('Missing test wheel');
    }

    return GAME_CONFIG.car.axleY - car.chassis.getLocalPoint(wheel.getPosition()).y;
}
