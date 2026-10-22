import { Box, Vec2, RevoluteJoint, type World, type Body } from 'planck';

import { GAME_CONFIG } from '@zombie-drive/shared';

import type { PhysicalPart } from '../physics/types';

import type { Zombie } from './types';

export function createRagdoll(world: World, zombie: Zombie): void {
    const parts = createRagdollParts(world, zombie);
    const torso = parts[0];

    if (!torso) {
        throw new Error('Ragdoll configuration requires a torso');
    }

    connectLimbs(world, torso.body, parts, zombie);
    world.destroyBody(zombie.body);
    zombie.body = torso.body;
    zombie.parts = parts;
    zombie.state = 'ragdoll';
}

function createRagdollParts(world: World, zombie: Zombie): Array<PhysicalPart> {
    const source = zombie.body;
    const origin = source.getPosition();
    const velocity = source.getLinearVelocity();
    const angularVelocity = source.getAngularVelocity();

    return GAME_CONFIG.zombies.bodyParts.map((part): PhysicalPart => {
        const size = { halfWidth: part.halfWidth * zombie.scale, halfHeight: part.halfHeight * zombie.scale };

        const body = createPart(world, {
            x: origin.x + part.x * zombie.scale,
            y: origin.y + part.y * zombie.scale,
            part: size,
            canHitBarrels: zombie.canHitBarrels,
        });

        body.setLinearVelocity(velocity);
        body.setAngularVelocity(angularVelocity);

        return { body, shape: { kind: 'box', ...size } };
    });
}

function connectLimbs(world: World, torso: Body, parts: ReadonlyArray<PhysicalPart>, zombie: Zombie): void {
    const origin = zombie.body.getPosition();

    parts.slice(1).forEach((part, index): void => {
        const settings = GAME_CONFIG.zombies.bodyParts[index + 1];

        if (settings) {
            connect(world, {
                torso,
                limb: part.body,
                anchor: Vec2(origin.x + settings.jointX * zombie.scale, origin.y + settings.jointY * zombie.scale),
            });
        }
    });
}

function createPart(
    world: World,
    options: {
        x: number;
        y: number;
        part: { halfWidth: number; halfHeight: number };
        canHitBarrels: boolean;
    },
): Body {
    const settings = GAME_CONFIG.zombies;

    const body = world.createDynamicBody({
        position: Vec2(options.x, options.y),
        angularDamping: settings.ragdollDamping,
        bullet: true,
    });

    body.createFixture(new Box(options.part.halfWidth, options.part.halfHeight), {
        density: settings.ragdollDensity,
        friction: settings.ragdollFriction,
        restitution: settings.restitution,
        filterCategoryBits: GAME_CONFIG.collisions.ragdoll,
        filterMaskBits: GAME_CONFIG.collisions.ground | (options.canHitBarrels ? GAME_CONFIG.collisions.barrel : 0),
    });

    return body;
}

function connect(world: World, options: { torso: Body; limb: Body; anchor: Vec2 }): void {
    world.createJoint(
        new RevoluteJoint(
            {
                enableLimit: true,
                lowerAngle: GAME_CONFIG.zombies.jointLowerAngle,
                upperAngle: GAME_CONFIG.zombies.jointUpperAngle,
                collideConnected: false,
            },
            options.torso,
            options.limb,
            options.anchor,
        ),
    );
}
