import { Vec2 } from 'planck';
import { expect, it } from 'vitest';

import { carStats, vehicleConfig, type VehicleId } from '@zombie-drive/shared';

import { GameSimulation } from '../apps/web/src/game/GameSimulation';
import { vehicleStyles } from '../apps/web/src/ui/common/Vehicle.utils';

import { IDLE } from './physics.helpers';
import { slopeControls } from './level-controls.helpers';
import { observeWheelTravel, touchesSuspensionStop, type TravelErrors } from './wheel-travel.helpers';

interface WheelReference {
    vehicleId: VehicleId;
    centers: ReadonlyArray<number>;
    peaks: ReadonlyArray<number>;
}

// Measured from the transparent arch openings in the vehicle images.
const REFERENCES: ReadonlyArray<WheelReference> = [
    { vehicleId: 'truck', centers: [ 0.144, 0.355, 0.804 ], peaks: [ 0.714, 0.716, 0.615 ] },
    { vehicleId: 'r8', centers: [ 0.165, 0.782 ], peaks: [ 0.457, 0.467 ] },
];

const CASES = REFERENCES.flatMap(({ vehicleId }) => [ 0, 3, 5 ].map((level) => ({ vehicleId, level })));

it.each(REFERENCES)('aligns every $vehicleId tire tier with its actual wheel arches', (reference): void => {
    const vehicle = vehicleConfig(reference.vehicleId);
    const travel = vehicle.suspensionTravel;

    if (!travel) {
        throw new Error('Missing wheel travel bounds');
    }

    for (let tires = 0; tires <= 5; tires++) {
        const game = scene(reference.vehicleId, tires);
        const styles = vehicleStyles(tires, reference.vehicleId);
        const wheelTop = game.car.stats.axleHeight - travel.compression - game.car.stats.wheelRadius;

        styles.wheels.forEach((wheel, index): void => {
            const diameter = Number.parseFloat(String(wheel.width)) / 100;
            const center = Number.parseFloat(String(wheel.left)) / 100 + diameter / 2;
            const archTop = ((reference.peaks[index] ?? 0) - vehicle.originY) * vehicle.height;

            expect(center).toBeCloseTo(reference.centers[index] ?? 0, 2);
            expect(wheelTop - archTop).toBeGreaterThan(0.01);
        });
    }
});

it.each(CASES)('keeps $vehicleId wheels inside their travel while driving at tier $level', (test): void => {
    const game = scene(test.vehicleId, test.level);
    const errors: TravelErrors = { compression: 0, extension: 0, horizontal: 0 };

    while (!game.rules.reason && game.rules.elapsed < 240) {
        game.step(slopeControls(game));
        observeWheelTravel(game, errors);
    }

    expect(errors.compression).toBeLessThan(0.015);
    expect(errors.extension).toBeLessThan(0.015);
    expect(errors.horizontal).toBeLessThan(0.025);
});

it.each(CASES)('stops $vehicleId wheels entering the body after a hard landing at tier $level', (test): void => {
    const game = scene(test.vehicleId, test.level, true);
    const errors: TravelErrors = { compression: 0, extension: 0, horizontal: 0 };

    game.car.bodies.forEach((body): void => {
        body.setPosition(Vec2.add(body.getPosition(), Vec2(0, -4)));
        body.setLinearVelocity(Vec2(5, 18));
    });

    for (let step = 0; step < 240; step++) {
        game.step(IDLE);
        observeWheelTravel(game, errors);
    }

    expect(game.car.isGrounded()).toBe(true);
    expect(errors.compression).toBeLessThan(0.015);
    expect(errors.extension).toBeLessThan(0.015);
});

function scene(vehicleId: VehicleId, level: number, isFlat = false): GameSimulation {
    const stats = carStats({
        engine: level,
        tank: level,
        tires: level,
        suspension: level,
        plow: Number(level > 0),
    }, vehicleId);

    return new GameSimulation(stats, isFlat ? { isFlat, spawns: [], crateSpawns: [], barrelSpawns: [] } : {});
}

it.each(REFERENCES)('does not count internal $vehicleId wheel stops as ground support', (reference): void => {
    const game = scene(reference.vehicleId, 0, true);
    const vehicle = vehicleConfig(reference.vehicleId);
    const compression = vehicle.suspensionTravel?.compression ?? 0;

    game.car.bodies.forEach((body): void => {
        body.setPosition(Vec2.add(body.getPosition(), Vec2(0, -4)));
    });

    game.car.wheels.forEach((wheel, index): void => {
        const local = Vec2(vehicle.axles[index] ?? 0, game.car.stats.axleHeight - compression - 0.02);

        wheel.setPosition(game.car.chassis.getWorldPoint(local));
    });

    game.step(IDLE);

    expect(game.car.wheels.some(touchesSuspensionStop)).toBe(true);
    expect(game.car.isGrounded()).toBe(false);
    expect(game.car.isTouchingSurface()).toBe(false);
});
