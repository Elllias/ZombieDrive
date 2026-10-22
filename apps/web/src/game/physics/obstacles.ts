import { GAME_CONFIG, HAZARDS } from '@zombie-drive/shared';

import type { Zombies } from '../zombies/Zombies';
import type { Crates } from '../crates/Crates';
import type { ImpactResistance } from './ImpactResistance';

export function obstacles(zombies: Zombies, crates: Crates): ConstructorParameters<typeof ImpactResistance>[2] {
    return [
        ...zombies.actors.map((actor) => ({
            body: actor.body,
            isZombie: true,
            settings: actor.kind === 'heavy' ? HAZARDS.heavyZombie.impact : GAME_CONFIG.zombies.impact,
        })),

        ...crates.actors.map((actor) => ({ body: actor.part.body, settings: GAME_CONFIG.crates.impact })),
    ];
}
