import { Box, RopeJoint, Vec2, type Body, type World } from 'planck';

import { GAME_CONFIG, vehicleConfig, type CarStats } from '@zombie-drive/shared';

interface SuspensionOptions {
    offsetX: number;
    stats: CarStats;
}

export function attachSuspensionStops(
    world: World, chassis: Body, wheel: Body, options: SuspensionOptions,
): void {
    const travel = vehicleConfig(options.stats.vehicleId).suspensionTravel;

    if (!travel) {
        return;
    }

    const length = travel.compression + travel.extension;
    const minimumY = options.stats.axleHeight - travel.compression;

    addWheelStops(chassis, options, minimumY, options.stats.axleHeight + travel.extension);

    world.createJoint(new RopeJoint({
        bodyA: chassis,
        bodyB: wheel,
        localAnchorA: Vec2(options.offsetX, minimumY),
        localAnchorB: Vec2(0, 0),
        maxLength: length,
        collideConnected: true,
    }));
}

function addWheelStops(chassis: Body, options: SuspensionOptions, minimumY: number, maximumY: number): void {
    const settings = vehicleConfig(options.stats.vehicleId).settings;
    const radius = options.stats.wheelRadius;
    const thickness = settings.suspensionStopHalfHeight;
    const sideOffset = radius + thickness + settings.suspensionSideClearance;
    const sideHeight = radius + (maximumY - minimumY) / 2;
    const middleY = (minimumY + maximumY) / 2;

    const shapes = [
        new Box(settings.suspensionStopHalfWidth, thickness, Vec2(options.offsetX, minimumY - radius - thickness)),
        new Box(thickness, sideHeight, Vec2(options.offsetX - sideOffset, middleY)),
        new Box(thickness, sideHeight, Vec2(options.offsetX + sideOffset, middleY)),
    ];

    // Contact stops also participate in continuous collision steps, where joint limits are not solved.
    shapes.forEach((shape): void => {
        chassis.createFixture(shape, {
            density: 0,
            friction: 0,
            filterCategoryBits: GAME_CONFIG.collisions.suspensionStop,
            filterMaskBits: GAME_CONFIG.collisions.car,
        });
    });
}
