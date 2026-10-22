import { Vec2 } from 'planck';
import { expect, it } from 'vitest';

import { IDLE } from './physics.helpers';
import { truckScene } from './second-stage.helpers';

function impact(kind: 'normal' | 'heavy', plow: number): number {
    const game = truckScene({ spawns: [ { id: 'target', x: 10, kind } ] }, plow);
    const control = truckScene({}, plow);

    for (const scene of [ game, control ]) {
        scene.car.bodies.forEach((body): void => body.setLinearVelocity(Vec2(15, 0)));
    }

    while (game.zombies.killed.size === 0 && game.rules.elapsed < 2) {
        game.step(IDLE);
        control.step(IDLE);
    }

    expect(game.zombies.killed.size).toBe(1);

    return control.car.chassis.getLinearVelocity().x - game.car.chassis.getLinearVelocity().x;
}

it('makes heavy zombies larger and more resistant than normal zombies', (): void => {
    const scene = truckScene({ spawns: [
        { id: 'normal', x: 12 }, { id: 'heavy', x: 18, kind: 'heavy' },
    ] });

    const normal = scene.zombies.actors[0];
    const heavy = scene.zombies.actors[1];

    expect(heavy?.scale).toBeGreaterThan(normal?.scale ?? 0);
    expect(heavy?.body.getMass()).toBeGreaterThan((normal?.body.getMass() ?? 0) * 3);
    expect(impact('heavy', 0)).toBeGreaterThan(impact('normal', 0) + 2);
});

it('gives the installed plow its full effect and preserves legacy purchases', (): void => {
    const plain = impact('heavy', 0);
    const installed = impact('heavy', 1);
    const legacy = impact('heavy', 5);

    expect(installed).toBeLessThan(plain - 2.5);
    expect(legacy).toBeCloseTo(installed, 6);
});

it('scales ragdoll dimensions and keeps dead zombies from colliding with the truck', (): void => {
    const game = truckScene({ spawns: [ { id: 'target', x: 10, kind: 'heavy' } ] }, 1);

    game.car.bodies.forEach((body): void => body.setLinearVelocity(Vec2(15, 0)));

    for (let step = 0; step < 120; step++) {
        game.step(IDLE);
    }

    expect(game.zombies.actors[0]?.state).toBe('ragdoll');

    game.zombies.actors[0]?.parts.forEach((part): void => {
        expect(part.body.getFixtureList()?.getFilterMaskBits()).toBe(1);
        expect(part.body.getPosition().y).toBeLessThan(7.4);
    });
});

it('does not protect rear impacts merely because a plow is installed', (): void => {
    const speeds = [ 0, 1 ].map((plow) => {
        const game = truckScene({ spawns: [ { id: 'rear', x: -1, kind: 'heavy' } ] }, plow);

        game.car.bodies.forEach((body): void => body.setLinearVelocity(Vec2(-12, 0)));

        while (game.zombies.killed.size === 0 && game.rules.elapsed < 2) {
            game.step(IDLE);
        }

        expect(game.zombies.killed.size).toBe(1);

        return game.car.chassis.getLinearVelocity().x;
    });

    expect(speeds[0]).toBeCloseTo(speeds[1] ?? 0, 6);
});
