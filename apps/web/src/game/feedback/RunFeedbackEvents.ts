import type { GameSimulation } from '../GameSimulation';

export type RunFeedbackEvent = {
    sound: 'wood' | 'hit' | 'metal' | 'explosion';
    volume: number;
    rate: number;
    isHeavy?: boolean;
};

export class RunFeedbackEvents {
    private readonly heard = new Set<string>();
    private wasGrounded = true;
    private fallSpeed = 0;

    collect(simulation: GameSimulation): Array<RunFeedbackEvent> {
        const events: Array<RunFeedbackEvent> = [];
        const carX = simulation.car.chassis.getPosition().x;

        simulation.crates.actors.forEach((crate) => {
            if (this.isNew(`crate:${ crate.id }`, crate.isBroken, crate.part.body.getPosition().x - carX)) {
                events.push({ sound: 'wood', volume: 0.6, rate: 0.9 + Math.random() * 0.2 });
            }
        });

        simulation.zombies.actors.forEach((zombie) => {
            if (this.isNew(`zombie:${ zombie.id }`, zombie.state === 'ragdoll', zombie.body.getPosition().x - carX)) {
                const isHeavy = zombie.kind === 'heavy';

                events.push({ sound: 'hit', volume: isHeavy ? 0.8 : 0.55, rate: isHeavy ? 0.75 : 1, isHeavy });
            }
        });

        this.collectBarrels(simulation, events);
        this.collectLanding(simulation, events);

        return events;
    }

    private collectBarrels(simulation: GameSimulation, events: Array<RunFeedbackEvent>): void {
        const carX = simulation.car.chassis.getPosition().x;

        simulation.barrels.actors.forEach((barrel) => {
            if (this.isNew(`barrel:${ barrel.id }`, barrel.isExploded, barrel.part.body.getPosition().x - carX)) {
                events.push({ sound: 'explosion', volume: 0.8, rate: 0.95 + Math.random() * 0.1 });
            }
        });
    }

    private isNew(id: string, occurred: boolean, distance: number): boolean {
        if (!occurred || this.heard.has(id)) {
            return false;
        }

        this.heard.add(id);

        return Math.abs(distance) < 30;
    }

    private collectLanding(simulation: GameSimulation, events: Array<RunFeedbackEvent>): void {
        const grounded = simulation.car.isGrounded();

        if (grounded && !this.wasGrounded && this.fallSpeed > 2.5) {
            events.push({ sound: 'metal', volume: Math.min(0.65, this.fallSpeed / 16), rate: 0.85 });
        }

        this.wasGrounded = grounded;
        this.fallSpeed = simulation.car.chassis.getLinearVelocity().y;
    }
}
