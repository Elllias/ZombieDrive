import { Box, Vec2, type World } from 'planck';

import { GAME_CONFIG, terrainHeight, type TrackConfig } from '@zombie-drive/shared';

import type { Crate } from './types';

export function createCrate(
    world: World, spawn: { id: string; x: number; row: number }, track: TrackConfig = GAME_CONFIG.track,
): Crate {
    const settings = GAME_CONFIG.crates;
    const y = terrainHeight(spawn.x, track) - settings.halfSize - spawn.row * (settings.halfSize * 2 + settings.rowGap);
    const body = world.createDynamicBody({ position: Vec2(spawn.x, y), bullet: true });

    body.createFixture(new Box(settings.halfSize, settings.halfSize), {
        density: settings.density,
        friction: settings.friction,
        restitution: settings.restitution,
        filterCategoryBits: GAME_CONFIG.collisions.crate,

        filterMaskBits:
            GAME_CONFIG.collisions.ground | GAME_CONFIG.collisions.car
            | GAME_CONFIG.collisions.crate | GAME_CONFIG.collisions.barrel,
    });

    return {
        id: spawn.id,
        isBroken: false,
        part: { body, shape: { kind: 'box', halfWidth: settings.halfSize, halfHeight: settings.halfSize } },
    };
}
