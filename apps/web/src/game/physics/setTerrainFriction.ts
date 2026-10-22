import type { Contact } from 'planck';

import { GAME_CONFIG, terrainFriction, type TrackConfig } from '@zombie-drive/shared';

export function setTerrainFriction(contact: Contact, track: TrackConfig = GAME_CONFIG.track): void {
    const first = contact.getFixtureA();
    const second = contact.getFixtureB();
    const groundCategory = GAME_CONFIG.collisions.ground;
    const ground = [ first, second ].find((fixture) => fixture.getFilterCategoryBits() === groundCategory);

    if (!ground) {
        return;
    }

    const other = ground === first ? second : first;
    const point = contact.getWorldManifold(null)?.points[0];

    if (!point) {
        return;
    }

    contact.setFriction(Math.sqrt(terrainFriction(point.x, track) * other.getFriction()));
}
