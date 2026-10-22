import { carStats } from '@zombie-drive/shared';

import { GameSimulation } from '../apps/web/src/game/GameSimulation';

export const BASE_STATS = carStats({ engine: 0, tank: 0, tires: 0, suspension: 0 });

export const GAS = { gas: true, brake: false, tilt: 0 };

export const IDLE = { gas: false, brake: false, tilt: 0 };

export function simulation(spawns: Array<{ id: string; x: number }> = []): GameSimulation {
    return new GameSimulation(BASE_STATS, { isFlat: true, spawns });
}

export function drive(game: GameSimulation, options: { seconds: number; fps?: number }): void {
    const fps = options.fps ?? 60;

    for (let frame = 0; frame < options.seconds * fps; frame += 1) {
        game.advance(1000 / fps, GAS);
    }
}
