import { Vec2, type Body, type Contact, type ContactImpulse, type World } from 'planck';

import { GAME_CONFIG, HAZARDS, type BarrelSpawn, type TrackConfig } from '@zombie-drive/shared';

import type { PhysicalPart } from '../physics/types';
import { impactSpeed } from '../physics/impactSpeed';

import { createBarrel } from './createBarrel';
import { applyBlast } from './applyBlast';
import type { Barrel, BlastTargets, Explosion } from './types';

export class Barrels {
    readonly actors: Array<Barrel>;
    readonly explosions: Array<Explosion> = [];
    private readonly byBody = new Map<Body, Barrel>();
    private readonly pending = new Set<Barrel>();
    private approachSpeeds = new WeakMap<Contact, number>();

    constructor(
        private readonly world: World,
        spawns: ReadonlyArray<BarrelSpawn>,
        private readonly context: BlastTargets & { track: TrackConfig },
    ) {
        this.actors = spawns.map((spawn) => createBarrel(world, spawn, context.track));

        this.actors.forEach((actor): void => {
            this.byBody.set(actor.part.body, actor);
        });

        world.on('pre-solve', (contact): void => this.captureSpeed(contact));
        world.on('post-solve', (contact, impulse): void => this.markCollision(contact, impulse));
    }

    beforeStep(carX: number): void {
        this.approachSpeeds = new WeakMap();
        this.activateNearby(carX);
        this.ageExplosions();
    }

    private activateNearby(carX: number): void {
        this.actors.filter((actor) => !actor.isExploded).forEach((actor): void => {
            const x = actor.part.body.getPosition().x;

            actor.part.body.setActive(x > carX - HAZARDS.barrel.activeBehind && x < carX + HAZARDS.barrel.activeAhead);
        });
    }

    private ageExplosions(): void {
        for (let index = this.explosions.length - 1; index >= 0; index--) {
            const effect = this.explosions[index];

            if (effect) {
                effect.age += GAME_CONFIG.world.stepSeconds;

                if (effect.age >= HAZARDS.barrel.effectSeconds) {
                    this.explosions.splice(index, 1);
                }
            }
        }
    }

    afterStep(): void {
        // Contacts queue barrels; world mutation happens after the solver unlocks.
        while (this.pending.size > 0) {
            const barrel = this.pending.values().next().value;

            if (!barrel) {
                break;
            }

            this.pending.delete(barrel);

            if (!barrel.isExploded) {
                this.explode(barrel);
            }
        }
    }

    get parts(): Array<PhysicalPart> {
        return this.actors.filter((actor) => !actor.isExploded).map((actor) => actor.part);
    }

    private captureSpeed(contact: Contact): void {
        const fixtures = [ contact.getFixtureA(), contact.getFixtureB() ];

        if (!fixtures.some((fixture) => this.byBody.has(fixture.getBody()))) {
            return;
        }

        const previous = this.approachSpeeds.get(contact) ?? 0;

        this.approachSpeeds.set(contact, Math.max(previous, impactSpeed(contact)));
    }

    private markCollision(contact: Contact, impulse: ContactImpulse): void {
        const approach = this.approachSpeeds.get(contact) ?? 0;
        const strength = impulse.normalImpulses.reduce((sum, value) => sum + value, 0);

        if (approach < HAZARDS.barrel.minimumImpactSpeed || strength < HAZARDS.barrel.detonationImpulse) {
            return;
        }

        [ contact.getFixtureA(), contact.getFixtureB() ].forEach((fixture): void => {
            const barrel = this.byBody.get(fixture.getBody());

            if (barrel) {
                this.pending.add(barrel);
            }
        });
    }

    private explode(barrel: Barrel): void {
        const position = barrel.part.body.getPosition().clone();

        barrel.isExploded = true;
        this.byBody.delete(barrel.part.body);
        this.world.destroyBody(barrel.part.body);
        this.explosions.push({ x: position.x, y: position.y, age: 0 });
        applyBlast(this.world, position, this.context);
        this.markChain(position);
    }

    private markChain(position: Vec2): void {
        this.actors.forEach((actor): void => {
            if (actor.isExploded || !actor.part.body.isActive()) {
                return;
            }

            const target = actor.part.body.getPosition();

            if (Math.hypot(target.x - position.x, target.y - position.y) <= HAZARDS.barrel.chainRadius) {
                this.pending.add(actor);
            }
        });
    }
}
