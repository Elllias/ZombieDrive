import { carStats, GAME_CONFIG, type Upgrades } from '@zombie-drive/shared';

import { GameSimulation } from '../apps/web/src/game/GameSimulation';
import type { Controls } from '../apps/web/src/game/physics/types';

export function r8Scene(level: number): GameSimulation {
    return new GameSimulation(carStats({ engine: level,
        tank: level,
        tires: level,
        suspension: level,
        plow: Number(level > 0) }, 'r8'));
}

export function driveThird(game: GameSimulation, controls: (game: GameSimulation) => Controls): GameSimulation {
    while (!game.rules.reason && game.rules.elapsed < GAME_CONFIG.run.activeLimitSeconds) {
        game.step(controls(game));
    }

    return game;
}

export const MAXIMUM_R8: Upgrades = { engine: 5, tank: 5, tires: 5, suspension: 5, plow: 1 };
