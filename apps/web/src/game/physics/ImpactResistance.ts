import { Vec2, type Body, type Contact, type World } from 'planck';

import { HAZARDS } from '@zombie-drive/shared';

import { impactSpeed } from './impactSpeed';

interface ImpactSettings {
    speedRetention: number;
    maxSpeedLoss: number;
    minImpactSpeed: number;
}

interface Obstacle {
    body: Body;
    settings: ImpactSettings;
    isZombie?: boolean;
}

export class ImpactResistance {
    private readonly obstacles: Map<Body, Obstacle>;
    private readonly candidates = new Map<Body, number>();
    private readonly hits = new Set<Body>();
    private readonly plowHits = new Set<Body>();
    private incomingSpeed = 0;

    constructor(
        world: World,
        private readonly carBodies: ReadonlyArray<Body>,
        obstacles: ReadonlyArray<Obstacle>,
        private readonly plowLevel = 0,
    ) {
        this.obstacles = new Map(obstacles.map((obstacle) => [ obstacle.body, obstacle ]));

        world.on('remove-body', (body): void => {
            this.obstacles.delete(body);
        });

        world.on('pre-solve', (contact): void => this.capture(contact));

        world.on('post-solve', (contact): void => this.confirmHits(contact));
    }

    beforeStep(): void {
        this.incomingSpeed = this.carBodies[0]?.getLinearVelocity().x ?? 0;
    }

    afterStep(): void {
        this.applyResistance();

        this.hits.forEach((body): void => {
            this.obstacles.delete(body);
        });

        this.hits.clear();
        this.plowHits.clear();
        this.candidates.clear();
    }

    private applyResistance(): void {
        const loss = [ ...this.hits ].reduce((total, body) => total + (this.candidates.get(body) ?? 0), 0);

        if (loss <= 0) {
            return;
        }

        const direction = Math.sign(this.incomingSpeed);
        const target = Math.max(0, Math.abs(this.incomingSpeed) - loss);
        const current = (this.carBodies[0]?.getLinearVelocity().x ?? 0) * direction;
        const canRedirect = this.hits.size > 0 && [ ...this.hits ].every((body) => this.plowHits.has(body));
        const speedChange = canRedirect ? current - target : Math.max(0, current - target);

        // The ram redirects the frontal hit into lifting the corpse. Recovery never exceeds incoming speed.
        // Other obstacles distribute braking across the rig so wheel joints cannot undo it.
        this.carBodies.forEach((body): void => {
            body.applyLinearImpulse(
                Vec2(-direction * speedChange * body.getMass(), 0),
                body.getWorldCenter(),
                true,
            );
        });
    }

    private confirmHits(contact: Contact): void {
        this.contactObstacles(contact).forEach((body): void => {
            if (!this.candidates.has(body)) {
                return;
            }

            this.hits.add(body);

            if (this.plowResistance(contact, this.obstacles.get(body)?.isZombie ?? false) < 1) {
                this.plowHits.add(body);
            }
        });
    }

    private contactObstacles(contact: Contact): Array<Body> {
        const bodies = [ contact.getFixtureA().getBody(), contact.getFixtureB().getBody() ];

        return bodies.some((body) => this.carBodies.includes(body))
            ? bodies.filter((body) => this.obstacles.has(body))
            : [];
    }

    private capture(contact: Contact): void {
        const approachSpeed = impactSpeed(contact);

        this.contactObstacles(contact).forEach((body): void => {
            const obstacle = this.obstacles.get(body);
            const settings = obstacle?.settings;

            if (!settings || approachSpeed < settings.minImpactSpeed) {
                return;
            }

            const loss = Math.min(
                settings.maxSpeedLoss,
                Math.abs(this.incomingSpeed) * (1 - settings.speedRetention),
            );

            const reducedLoss = loss * this.plowResistance(contact, obstacle?.isZombie ?? false);

            this.candidates.set(body, Math.max(this.candidates.get(body) ?? 0, reducedLoss));
        });
    }

    private plowResistance(contact: Contact, isZombie: boolean): number {
        const fixtures = [ contact.getFixtureA(), contact.getFixtureB() ];
        const hitsPlow = fixtures.some((fixture) => fixture.getUserData() === 'plow');

        if (!isZombie || !hitsPlow || this.plowLevel === 0) {
            return 1;
        }

        return 1 - HAZARDS.plow.resistanceReduction;
    }
}
