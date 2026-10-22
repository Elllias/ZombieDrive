import { Vec2 } from 'planck';
import { expect, it } from 'vitest';

import { GAME_CONFIG } from '@zombie-drive/shared';

import { GameSimulation } from '../apps/web/src/game/GameSimulation';

import { BASE_STATS } from './physics.helpers';

it('lets the player move backward for a run-up without treating the car as stuck', (): void => {
    const game = new GameSimulation(BASE_STATS, { isFlat: true, spawns: [], crateSpawns: [] });
    const seconds = GAME_CONFIG.run.stuckSeconds + 2;

    for (let step = 0; step < seconds / GAME_CONFIG.world.stepSeconds; step += 1) {
        const body = game.car.chassis;
        const position = body.getPosition();

        body.setPosition(Vec2(position.x - 0.01, position.y));
        game.rules.afterStep(game.car);
    }

    expect(game.rules.distance).toBe(0);
    expect(game.rules.reason).toBeNull();
});

it('still ends a genuinely immobile attempt after the configured delay', (): void => {
    const game = new GameSimulation(BASE_STATS, { isFlat: true, spawns: [], crateSpawns: [] });

    for (let step = 0; step < (GAME_CONFIG.run.stuckSeconds + 1) / GAME_CONFIG.world.stepSeconds; step += 1) {
        game.rules.afterStep(game.car);
    }

    expect(game.rules.reason).toBe('stuck');
});
