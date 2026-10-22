import type { Body } from 'planck';

import { GAME_CONFIG } from '@zombie-drive/shared';

export interface WheelSupport {
    wheels: number;
    angle: number;
}

function surfaceAngle(body: Body): number | null {
    for (let edge = body.getContactList(); edge; edge = edge.next) {
        if (!edge.contact.isTouching()) {
            continue;
        }

        const first = edge.contact.getFixtureA();
        const second = edge.contact.getFixtureB();
        const surface = first.getBody() === body ? second : first;
        const categories = GAME_CONFIG.collisions.ground | GAME_CONFIG.collisions.crate | GAME_CONFIG.collisions.barrel;

        if ((surface.getFilterCategoryBits() & categories) === 0) {
            continue;
        }

        const normal = edge.contact.getWorldManifold(null)?.normal;

        if (!normal || Math.abs(normal.y) < GAME_CONFIG.car.minimumSupportNormalY) {
            continue;
        }

        const direction = first.getBody() === body ? 1 : -1;

        if (normal.y * direction <= 0) {
            continue;
        }

        return Math.atan2(-normal.x * direction, normal.y * direction);
    }

    return null;
}

export function wheelSupport(wheels: ReadonlyArray<Body>): WheelSupport {
    const angles = wheels.map(surfaceAngle).filter((angle) => angle !== null);
    const angle = angles.length ? angles.reduce((sum, value) => sum + value, 0) / angles.length : 0;

    return { wheels: angles.length, angle };
}
