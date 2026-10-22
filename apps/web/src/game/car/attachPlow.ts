import { Polygon, Vec2, type Body } from 'planck';

import { GAME_CONFIG, HAZARDS, plowPosition, vehicleConfig, type CarStats } from '@zombie-drive/shared';

export function attachPlow(chassis: Body, stats: CarStats): void {
    if (!stats.plowLevel || !vehicleConfig(stats.vehicleId).upgrades.includes('plow')) {
        return;
    }

    const { x, y } = plowPosition(stats.vehicleId);
    const { halfWidth: width, halfHeight: height } = HAZARDS.plow;

    chassis.createFixture(new Polygon([
        Vec2(x - width, y - height), Vec2(x + width, y), Vec2(x - width, y + height),
    ]), {
        density: 0,
        friction: 0.1,
        userData: 'plow',
        filterCategoryBits: GAME_CONFIG.collisions.car,
        filterMaskBits: GAME_CONFIG.collisions.alive | GAME_CONFIG.collisions.crate | GAME_CONFIG.collisions.barrel,
        filterGroupIndex: GAME_CONFIG.car.ownCollisionGroup,
    });
}
