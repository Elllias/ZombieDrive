import type { Body } from 'planck';

import { GAME_CONFIG, vehicleConfig } from '@zombie-drive/shared';

import type { GameSimulation } from '../apps/web/src/game/GameSimulation';

export interface TravelErrors {
    compression: number;
    extension: number;
    horizontal: number;
}

export function touchesSuspensionStop(wheel: Body): boolean {
    for (let edge = wheel.getContactList(); edge; edge = edge.next) {
        const fixtures = [ edge.contact.getFixtureA(), edge.contact.getFixtureB() ];

        if (edge.contact.isTouching() && fixtures.some(
            (fixture) => fixture.getFilterCategoryBits() === GAME_CONFIG.collisions.suspensionStop,
        )) {
            return true;
        }
    }

    return false;
}

export function observeWheelTravel(game: GameSimulation, errors: TravelErrors): void {
    const vehicle = vehicleConfig(game.car.stats.vehicleId);
    const travel = vehicle.suspensionTravel;

    if (!travel) {
        throw new Error('Missing suspension travel limits');
    }

    game.car.wheels.forEach((wheel, index): void => {
        const local = game.car.chassis.getLocalPoint(wheel.getPosition());
        const rest = game.car.stats.axleHeight;

        errors.compression = Math.max(errors.compression, rest - travel.compression - local.y);
        errors.extension = Math.max(errors.extension, local.y - rest - travel.extension);
        errors.horizontal = Math.max(errors.horizontal, Math.abs(local.x - (vehicle.axles[index] ?? 0)));
    });
}
