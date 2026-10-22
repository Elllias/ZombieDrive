import { Box, Vec2, type World, type Body } from 'planck';

import { GAME_CONFIG, terrainHeight, vehicleConfig, type CarStats, type TrackConfig } from '@zombie-drive/shared';

export function createChassis(world: World, stats: CarStats, track: TrackConfig = GAME_CONFIG.track): Body {
    const settings = vehicleConfig(stats.vehicleId).settings;
    const startHeight = stats.axleHeight + stats.wheelRadius + settings.spawnClearance;
    const position = Vec2(settings.startX, terrainHeight(settings.startX, track) - startHeight);

    const chassis = world.createDynamicBody({
        position,
        angularDamping: settings.angularDamping,
        allowSleep: false,
        bullet: true,
    });

    attachChassisFixtures(chassis, stats);

    return chassis;
}

function attachChassisFixtures(chassis: Body, stats: CarStats): void {
    const settings = vehicleConfig(stats.vehicleId).settings;

    const fixture = {
        density: settings.chassisDensity,
        friction: 0,
        filterCategoryBits: GAME_CONFIG.collisions.car,

        filterMaskBits:
            GAME_CONFIG.collisions.ground | GAME_CONFIG.collisions.alive | GAME_CONFIG.collisions.crate
            | GAME_CONFIG.collisions.barrel,

        filterGroupIndex: settings.ownCollisionGroup,
    };

    chassis.createFixture(new Box(settings.chassisHalfWidth, settings.chassisHalfHeight), fixture);

    chassis.createFixture(
        new Box(
            settings.cabinHalfWidth,
            settings.cabinHalfHeight,
            Vec2(settings.cabinOffsetX, settings.cabinOffsetY),
        ),
        fixture,
    );
}
