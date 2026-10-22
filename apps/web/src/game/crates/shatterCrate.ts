import { Box, Vec2, type Body, type World } from 'planck';

import { GAME_CONFIG } from '@zombie-drive/shared';

import type { Crate, CrateFragment } from './types';

interface FragmentOffset {
    x: number;
    y: number;
    frame: number;
}

export function shatterCrate(world: World, crate: Crate): Array<CrateFragment> {
    const halfSize = GAME_CONFIG.crates.halfSize / 2;

    const fragments = [ -1, 1 ].flatMap((y, row) =>
        [ -1, 1 ].map((x, column) =>
            createFragment(world, crate, { x: x * halfSize, y: y * halfSize, frame: row * 2 + column }),
        ),
    );

    crate.isBroken = true;
    world.destroyBody(crate.part.body);

    return fragments;
}

function createFragment(world: World, crate: Crate, offset: FragmentOffset): CrateFragment {
    const body = createFragmentBody(world, crate, offset);
    const halfSize = GAME_CONFIG.crates.halfSize / 2;

    return {
        id: `${ crate.id }-fragment-${ offset.frame }`,
        frame: offset.frame,
        remainingSeconds: GAME_CONFIG.crates.fragmentSeconds,
        part: { body, shape: { kind: 'box', halfWidth: halfSize, halfHeight: halfSize } },
    };
}

function createFragmentBody(world: World, crate: Crate, offset: FragmentOffset): Body {
    const settings = GAME_CONFIG.crates;
    const position = crate.part.body.getWorldPoint(Vec2(offset.x, offset.y));
    const body = world.createDynamicBody({ position, angle: crate.part.body.getAngle(), bullet: true });
    const halfSize = settings.halfSize / 2;

    body.createFixture(new Box(halfSize, halfSize), {
        density: settings.fragmentDensity,
        friction: settings.friction,
        filterCategoryBits: GAME_CONFIG.collisions.debris,
        filterMaskBits: GAME_CONFIG.collisions.ground | GAME_CONFIG.collisions.barrel,
    });

    body.setLinearVelocity(crate.part.body.getLinearVelocityFromWorldPoint(position));

    body.setAngularVelocity(
        crate.part.body.getAngularVelocity() + (offset.frame - 1.5) * settings.fragmentSpinSpread,
    );

    return body;
}
