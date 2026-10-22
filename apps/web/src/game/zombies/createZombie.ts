import { Box, Vec2, type Body, type World } from 'planck';

import { GAME_CONFIG, HAZARDS, terrainHeight, type TrackConfig, type ZombieSpawn } from '@zombie-drive/shared';

import type { Zombie } from './types';

export function createZombie(
    world: World,
    spawn: ZombieSpawn,
    options: { track: TrackConfig; canHitBarrels: boolean } = { track: GAME_CONFIG.track, canHitBarrels: false },
): Zombie {
    const kind = spawn.kind ?? 'normal';
    const scale = kind === 'heavy' ? HAZARDS.heavyZombie.scale : 1;
    const body = createZombieBody(world, { spawn, scale, ...options });

    return {
        id: spawn.id,
        kind,
        scale,
        canHitBarrels: options.canHitBarrels,
        body,
        state: 'waiting',

        parts: [ { body,

            shape: {
                kind: 'box',
                halfWidth: GAME_CONFIG.zombies.aliveHalfWidth * scale,
                halfHeight: GAME_CONFIG.zombies.aliveHalfHeight * scale,
            } } ],
    };
}

function createZombieBody(
    world: World,
    options: { spawn: ZombieSpawn; scale: number; track: TrackConfig; canHitBarrels: boolean },
): Body {
    const { spawn, scale, track, canHitBarrels } = options;
    const settings = GAME_CONFIG.zombies;

    const body = world.createDynamicBody({
        position: Vec2(spawn.x, terrainHeight(spawn.x, track) - settings.aliveHalfHeight * scale),
        fixedRotation: true,
        linearDamping: settings.walkingDamping,
        active: false,
        bullet: true,
    });

    body.createFixture(new Box(settings.aliveHalfWidth * scale, settings.aliveHalfHeight * scale), {
        density: spawn.kind === 'heavy' ? HAZARDS.heavyZombie.density : settings.aliveDensity,
        friction: settings.aliveFriction,
        filterCategoryBits: GAME_CONFIG.collisions.alive,

        filterMaskBits: GAME_CONFIG.collisions.ground | GAME_CONFIG.collisions.car
            | (canHitBarrels ? GAME_CONFIG.collisions.barrel : 0),
    });

    return body;
}
