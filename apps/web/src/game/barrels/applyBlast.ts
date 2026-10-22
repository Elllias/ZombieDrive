import { Vec2, type Body, type World } from 'planck';

import { HAZARDS } from '@zombie-drive/shared';

import type { BlastTargets } from './types';

export function applyBlast(world: World, center: Vec2, targets: BlastTargets): void {
    for (let body = world.getBodyList(); body; body = body.getNext()) {
        if (!body.isDynamic() || !body.isActive()) {
            continue;
        }

        const impulse = blastImpulse(body, center);

        if (!impulse) {
            continue;
        }

        const isCar = targets.car.bodies.includes(body);
        const maximum = body.getMass() * (isCar ? 4 : 12);
        const length = impulse.length();

        body.applyLinearImpulse(impulse.mul(Math.min(1, maximum / length)), body.getWorldCenter(), true);
        breakActors(body, length, targets);
    }
}

function blastImpulse(body: Body, center: Vec2): Vec2 | null {
    const position = body.getWorldCenter();
    const offset = Vec2(position.x - center.x, position.y - center.y);
    const distance = offset.length();

    if (distance > HAZARDS.barrel.blastRadius) {
        return null;
    }

    const direction = distance > 0.05 ? offset.mul(1 / distance) : Vec2(0, -1);
    const force = HAZARDS.barrel.blastImpulse * (1 - distance / HAZARDS.barrel.blastRadius);

    return direction.mul(force);
}

function breakActors(body: Body, impulse: number, targets: BlastTargets): void {
    if (impulse >= HAZARDS.barrel.blastBreakImpulse) {
        targets.crates.breakBody(body);
    }

    if (impulse >= HAZARDS.barrel.blastKillImpulse) {
        targets.zombies.kill(body);
    }
}
