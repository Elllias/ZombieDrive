import { Box, Vec2, type World } from 'planck';

import { GAME_CONFIG, HAZARDS, terrainHeight, type BarrelSpawn, type TrackConfig } from '@zombie-drive/shared';

import type { Barrel } from './types';

export function createBarrel(world: World, spawn: BarrelSpawn, track: TrackConfig): Barrel {
    const settings = HAZARDS.barrel;
    const y = terrainHeight(spawn.x, track) - settings.halfHeight * (1 + spawn.row * 2);
    const body = world.createDynamicBody({ position: Vec2(spawn.x, y), active: false, bullet: true });

    body.createFixture(new Box(settings.halfWidth, settings.halfHeight), {
        density: settings.density,
        friction: settings.friction,
        restitution: 0.05,
        filterCategoryBits: GAME_CONFIG.collisions.barrel,
        filterMaskBits: Object.values(GAME_CONFIG.collisions).reduce((mask, category) => mask | category, 0),
    });

    return {
        id: spawn.id,
        isExploded: false,
        part: { body, shape: { kind: 'box', halfWidth: settings.halfWidth, halfHeight: settings.halfHeight } },
    };
}
