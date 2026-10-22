import { expect, it } from 'vitest';

import { carStats, vehicleConfig, VEHICLE_IDS, type VehicleId } from '@zombie-drive/shared';

import { driveCommand } from '../apps/web/src/game/car/driveCommand';
import { GameSimulation } from '../apps/web/src/game/GameSimulation';

import { GAS } from './physics.helpers';

const BOTH_PEDALS = { gas: true, brake: true, tilt: 0 };

it.each(VEHICLE_IDS)('brakes instead of boosting %s when both pedals are held at speed', (vehicleId): void => {
    const stats = carStats({ engine: 0, tank: 0, tires: 0, suspension: 0 }, vehicleId);
    const command = driveCommand(BOTH_PEDALS, { speed: 10, hasFuel: true, torque: stats.driveTorque, vehicleId });

    expect(command.speed).toBe(0);
    expect(command.torque).toBe(vehicleConfig(vehicleId).settings.brakeTorque);
    expect(command.isDriving).toBe(false);
});

it.each(VEHICLE_IDS)('uses ordinary reverse torque for %s when both pedals are held at rest', (vehicleId): void => {
    const stats = carStats({ engine: 0, tank: 0, tires: 0, suspension: 0 }, vehicleId);
    const command = driveCommand(BOTH_PEDALS, { speed: 0, hasFuel: true, torque: stats.driveTorque, vehicleId });

    expect(command.speed).toBe(vehicleConfig(vehicleId).settings.reverseMotorSpeed);
    expect(command.torque).toBe(stats.driveTorque);
    expect(command.isDriving).toBe(true);
});

it.each(VEHICLE_IDS)('keeps the brake available without fuel for %s', (vehicleId): void => {
    const command = driveCommand(BOTH_PEDALS, { speed: 0, hasFuel: false, torque: 150, vehicleId });

    expect(command.speed).toBe(0);
    expect(command.torque).toBe(vehicleConfig(vehicleId).settings.brakeTorque);
    expect(command.isDriving).toBe(false);
});

it.each(VEHICLE_IDS)('slows %s under both pedals and accelerates again after releasing the brake', (vehicleId): void => {
    const game = movingCar(vehicleId);
    const initialSpeed = game.car.chassis.getLinearVelocity().x;

    expect(initialSpeed).toBeGreaterThan(3);

    for (let step = 0; step < 45; step += 1) {
        game.step(BOTH_PEDALS);
    }

    const brakingSpeed = game.car.chassis.getLinearVelocity().x;

    expect(brakingSpeed).toBeLessThan(initialSpeed - 1);

    for (let step = 0; step < 120; step += 1) {
        game.step(GAS);
    }

    expect(game.car.chassis.getLinearVelocity().x).toBeGreaterThan(brakingSpeed + 1);
    expect(game.rules.reason).toBeNull();
});

function movingCar(vehicleId: VehicleId): GameSimulation {
    const stats = carStats({ engine: 5, tank: 5, tires: 5, suspension: 5 }, vehicleId);
    const game = new GameSimulation(stats, { isFlat: true, spawns: [], crateSpawns: [], barrelSpawns: [] });

    for (let step = 0; step < 300; step += 1) {
        game.step(GAS);
    }

    return game;
}
