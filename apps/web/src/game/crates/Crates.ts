import type { Body, Contact, World } from 'planck';

import { CRATE_SPAWNS, GAME_CONFIG, type CrateSpawn, type TrackConfig } from '@zombie-drive/shared';

import type { PhysicalPart } from '../physics/types';
import { impactSpeed } from '../physics/impactSpeed';

import { createCrate } from './createCrate';
import { shatterCrate } from './shatterCrate';
import type { Crate, CrateFragment } from './types';

export class Crates {
    readonly actors: Array<Crate>;
    readonly fragments: Array<CrateFragment> = [];
    private byBody = new Map<Body, Crate>();
    private pendingBreaks = new Set<Crate>();

    constructor(
        private world: World,
        carBodies: ReadonlyArray<Body>,
        spawns: ReadonlyArray<CrateSpawn> = CRATE_SPAWNS,
        track: TrackConfig = GAME_CONFIG.track,
    ) {
        this.actors = spawns.map((spawn) => createCrate(world, spawn, track));

        this.actors.forEach((crate): void => {
            this.byBody.set(crate.part.body, crate);
        });

        world.on('pre-solve', (contact): void => this.markImpact(contact, carBodies));
    }

    beforeStep(carX: number): void {
        const settings = GAME_CONFIG.crates;

        this.actors
            .filter((crate) => !crate.isBroken)
            .forEach((crate): void => {
                const x = crate.part.body.getPosition().x;

                crate.part.body.setActive(
                    x > carX - settings.activeBehind && x < carX + settings.activeAhead,
                );
            });

        for (let index = this.fragments.length - 1; index >= 0; index--) {
            const fragment = this.fragments[index];

            if (!fragment) {
                continue;
            }

            fragment.remainingSeconds -= GAME_CONFIG.world.stepSeconds;

            if (fragment.remainingSeconds > 0) {
                continue;
            }

            this.world.destroyBody(fragment.part.body);
            this.fragments.splice(index, 1);
        }
    }

    afterStep(): void {
        this.pendingBreaks.forEach((crate): void => {
            this.byBody.delete(crate.part.body);
            this.fragments.push(...shatterCrate(this.world, crate));
        });

        this.pendingBreaks.clear();
    }

    breakBody(body: Body): void {
        const crate = this.byBody.get(body);

        if (crate) {
            this.pendingBreaks.add(crate);
        }
    }

    get parts(): Array<PhysicalPart> {
        return [
            ...this.actors.filter((crate) => !crate.isBroken).map((crate) => crate.part),
            ...this.fragments.map((fragment) => fragment.part),
        ];
    }

    private markImpact(contact: Contact, carBodies: ReadonlyArray<Body>): void {
        const bodies = [ contact.getFixtureA().getBody(), contact.getFixtureB().getBody() ];
        const hitsCar = bodies.some((body) => carBodies.includes(body));

        if (!hitsCar || impactSpeed(contact) < GAME_CONFIG.crates.breakSpeed) {
            return;
        }

        bodies.forEach((body): void => {
            const crate = this.byBody.get(body);

            if (crate) {
                this.pendingBreaks.add(crate);
            }
        });
    }
}
