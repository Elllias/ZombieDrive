import type { GameSimulation } from '../apps/web/src/game/GameSimulation';
import type { Controls } from '../apps/web/src/game/physics/types';

import { slopeControls } from './level-controls.helpers';

export function buttonControls(game: GameSimulation): Controls {
    const controls = slopeControls(game);
    const tilt = Math.abs(controls.tilt) < 0.15 ? 0 : Math.sign(controls.tilt);

    return { ...controls, tilt };
}
