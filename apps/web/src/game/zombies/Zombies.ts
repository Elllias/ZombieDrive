import { Vec2, type World, type Body, type Contact } from 'planck';

import { GAME_CONFIG, HAZARDS, ZOMBIE_SPAWNS, type ZombieSpawn, type TrackConfig } from '@zombie-drive/shared';

import type { ViewBounds, PhysicalPart } from '../physics/types';

import { createZombie } from './createZombie';
import { createRagdoll } from './createRagdoll';
import type { Zombie } from './types';

export class Zombies {
    readonly actors: Array<Zombie>;
    readonly killed = new Set<string>();
    private plowHits = new Map<Body, number>();
    private pendingDeaths = new Set<Zombie>();
    private aliveByBody = new Map<Body, Zombie>();

    constructor(
        private world: World,
        carBodies: ReadonlyArray<Body>,
        spawns: ReadonlyArray<ZombieSpawn> = ZOMBIE_SPAWNS,
        options: { track: TrackConfig; canHitBarrels: boolean } = { track: GAME_CONFIG.track, canHitBarrels: false },
    ) {
        this.actors = spawns.map((spawn) => createZombie(world, spawn, options));

        this.actors.forEach((zombie): void => {
            this.aliveByBody.set(zombie.body, zombie);
        });

        world.on('pre-solve', (contact): void => this.adjustWalkingContact(contact));

        world.on('post-solve', (contact): void => this.markCarImpact(contact, carBodies));
    }

    private markCarImpact(contact: Contact, carBodies: ReadonlyArray<Body>): void {
        const fixtures = [ contact.getFixtureA(), contact.getFixtureB() ];

        if (!fixtures.some((fixture) => carBodies.includes(fixture.getBody()))) {
            return;
        }

        const plow = fixtures.find((fixture) => fixture.getUserData() === 'plow');

        fixtures.forEach((fixture): void => {
            const body = fixture.getBody();

            this.kill(body);

            if (plow && this.aliveByBody.has(body)) {
                this.plowHits.set(body, plow.getBody().getLinearVelocity().x);
            }
        });
    }

    kill(body: Body): void {
        const zombie = this.aliveByBody.get(body);

        if (zombie) {
            this.pendingDeaths.add(zombie);
        }
    }

    private adjustWalkingContact(contact: Contact): void {
        const fixtures = [ contact.getFixtureA(), contact.getFixtureB() ];

        if (!fixtures.some((fixture) => fixture.getFilterCategoryBits() === GAME_CONFIG.collisions.ground)) {
            return;
        }

        const zombie = fixtures
            .map((fixture) => this.aliveByBody.get(fixture.getBody()))
            .find((actor) => actor?.state === 'walking');

        // Ground friction must not pin a walking character; car contacts retain normal friction.
        if (zombie) {
            contact.setFriction(GAME_CONFIG.zombies.walkingGroundFriction);
        }
    }

    beforeStep(view: ViewBounds, carParts: ReadonlyArray<PhysicalPart>): void {
        const carX = carParts[0]?.body.getPosition().x ?? 0;

        this.actors.forEach((zombie): void => {
            this.activate(zombie, view, carX);

            if (!zombie.body.isActive()) {
                return;
            }

            if (zombie.state === 'walking') {
                this.walk(zombie, carX);
            }
        });
    }

    afterStep(): void {
        this.pendingDeaths.forEach((zombie): void => {
            const speed = this.plowHits.get(zombie.body);

            if (speed !== undefined) {
                zombie.body.setLinearVelocity(Vec2(speed + HAZARDS.plow.throwSpeed, -2));
                zombie.body.setAngularVelocity(-1.2);
            }

            this.aliveByBody.delete(zombie.body);
            createRagdoll(this.world, zombie);
            this.killed.add(zombie.id);
        });

        this.pendingDeaths.clear();
        this.plowHits.clear();
    }

    private activate(zombie: Zombie, view: ViewBounds, carX: number): void {
        const position = zombie.body.getPosition();

        const inRange = position.x > carX - GAME_CONFIG.zombies.activeBehind
            && position.x < carX + GAME_CONFIG.zombies.activeAhead;

        zombie.parts.forEach((part): void => {
            part.body.setActive(inRange);
        });

        const isVisible = position.x >= view.left
            && position.x <= view.right
            && position.y >= view.top
            && position.y <= view.bottom;

        if (zombie.state === 'waiting' && isVisible) {
            zombie.state = 'walking';
        }
    }

    private walk(zombie: Zombie, carX: number): void {
        const direction = Math.sign(carX - zombie.body.getPosition().x);
        const desiredSpeed = direction * (zombie.kind === 'heavy' ? HAZARDS.heavyZombie.speed : GAME_CONFIG.zombies.speed);
        const error = desiredSpeed - zombie.body.getLinearVelocity().x;
        const maximumForce = GAME_CONFIG.zombies.walkingForce * zombie.scale ** 3;

        const force = Math.max(
            -maximumForce,
            Math.min(
                maximumForce,
                error * zombie.body.getMass() * GAME_CONFIG.zombies.walkingResponsiveness,
            ),
        );

        zombie.body.applyForceToCenter(Vec2(force, 0), true);
    }
}
