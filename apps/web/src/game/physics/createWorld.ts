import { World, Vec2, Chain } from 'planck';

import { GAME_CONFIG, terrainHeight, type TrackConfig } from '@zombie-drive/shared';

import { setTerrainFriction } from './setTerrainFriction';

export function createWorld(isFlat = false, track: TrackConfig = GAME_CONFIG.track): World {
    const world = new World(Vec2(0, GAME_CONFIG.world.gravity));
    const terrain = world.createBody();
    const points = [];

    for (let x = -12; x <= track.length + 30; x += track.sampleSpacing) {
        points.push(Vec2(x, isFlat ? track.floorY : terrainHeight(x, track)));
    }

    terrain.createFixture(new Chain(points, false), {
        friction: track.groundFriction,
        filterCategoryBits: GAME_CONFIG.collisions.ground,

        filterMaskBits:
            GAME_CONFIG.collisions.car
            | GAME_CONFIG.collisions.alive
            | GAME_CONFIG.collisions.ragdoll
            | GAME_CONFIG.collisions.crate
            | GAME_CONFIG.collisions.debris
            | GAME_CONFIG.collisions.barrel,
    });

    if (!isFlat) {
        world.on('pre-solve', (contact): void => setTerrainFriction(contact, track));
    }

    return world;
}
