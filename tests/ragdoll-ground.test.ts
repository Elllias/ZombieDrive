import { Vec2 } from 'planck';
import { expect, it } from 'vitest';

import { carStats, terrainHeight } from '@zombie-drive/shared';

import { GameSimulation } from '../apps/web/src/game/GameSimulation';
import type { Zombie } from '../apps/web/src/game/zombies/types';

import { GAS } from './physics.helpers';

const UPGRADED_STATS = carStats({ engine: 5, tank: 5, tires: 5, suspension: 5 });

const SCENARIOS = [
    { x: 14, fps: 30 },
    { x: 14, fps: 60 },
    { x: 14, fps: 120 },
    { x: 29, fps: 60 },
    { x: 62, fps: 60 },
];

it.each(SCENARIOS)('keeps an actual killed zombie above ground at x=$x and $fps FPS', ({ x, fps }): void => {
    const game = new GameSimulation(UPGRADED_STATS, { spawns: [ { id: 'victim', x } ] });
    const zombie = game.zombies.actors[0];

    if (!zombie) {
        throw new Error('Missing test zombie');
    }

    let worstPenetration = 0;
    let hasDeathImpulse = false;

    for (let frame = 0; frame < fps * 10; frame += 1) {
        const previousState = zombie.state;

        game.advance(1000 / fps, GAS);

        if (zombie.state !== 'ragdoll') {
            continue;
        }

        if (previousState !== 'ragdoll') {
            hasDeathImpulse = zombie.parts.some((part) => part.body.getLinearVelocity().x > 1);
        }

        worstPenetration = Math.max(worstPenetration, groundPenetration(zombie));
    }

    expect(game.zombies.killed.size).toBe(1);
    expect(hasDeathImpulse).toBe(true);
    expect(worstPenetration).toBeLessThan(0.05);
});

function groundPenetration(zombie: Zombie): number {
    return Math.max(
        ...zombie.parts.flatMap((part) => {
            const shape = part.shape;

            if (shape.kind !== 'box') {
                throw new Error('Expected a box-shaped ragdoll part');
            }

            return [ -shape.halfWidth, shape.halfWidth ].flatMap((x) =>
                [ -shape.halfHeight, shape.halfHeight ].map((y) => {
                    const vertex = part.body.getWorldPoint(Vec2(x, y));

                    return vertex.y - terrainHeight(vertex.x);
                }),
            );
        }),
    );
}
