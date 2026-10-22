import { carStats } from '@zombie-drive/shared';

import { GameSimulation } from '../apps/web/src/game/GameSimulation';
import type { SimulationOptions } from '../apps/web/src/game/SimulationOptions';

export function truckScene(options: SimulationOptions = {}, plow = 0): GameSimulation {
    return new GameSimulation(carStats({ engine: 5, tank: 5, tires: 5, suspension: 5, plow }, 'truck'), {
        stageId: 'industrial', isFlat: true, spawns: [], crateSpawns: [], barrelSpawns: [], ...options,
    });
}
