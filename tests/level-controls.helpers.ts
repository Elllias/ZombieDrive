import { terrainHeight } from '@zombie-drive/shared';

import type { GameSimulation } from '../apps/web/src/game/GameSimulation';
import type { Controls } from '../apps/web/src/game/physics/types';

// Balance driver follows terrain by changing controls; physical bodies are never moved.
export function slopeControls(game: GameSimulation, gas = true, brake = false): Controls {
    const body = game.car.chassis;
    const x = body.getPosition().x;
    const slope = Math.atan2(terrainHeight(x + 2, game.stage.track) - terrainHeight(x - 2, game.stage.track), 4);
    const difference = slope - body.getAngle();
    const error = Math.atan2(Math.sin(difference), Math.cos(difference));
    const tilt = Math.max(-1, Math.min(1, error * 3 - body.getAngularVelocity() * 0.55));

    return { gas, brake, tilt };
}
