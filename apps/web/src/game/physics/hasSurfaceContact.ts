import type { Body } from 'planck';

import { GAME_CONFIG } from '@zombie-drive/shared';

export function hasSurfaceContact(body: Body): boolean {
    for (let edge = body.getContactList(); edge; edge = edge.next) {
        if (!edge.contact.isTouching()) {
            continue;
        }

        const fixtures = [ edge.contact.getFixtureA(), edge.contact.getFixtureB() ];

        if (
            fixtures.some(
                (fixture) =>
                    fixture.getBody() !== body
                    && (fixture.getFilterCategoryBits()
                        & (GAME_CONFIG.collisions.ground
                        | GAME_CONFIG.collisions.crate
                        | GAME_CONFIG.collisions.barrel))
                        !== 0,
            )
        ) {
            return true;
        }
    }

    return false;
}
