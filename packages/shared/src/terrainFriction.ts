import { GAME_CONFIG } from './configs/game';
import type { TrackConfig } from './trackTypes';
import { terrainSurface } from './terrainSurface';

export function terrainFriction(x: number, track: TrackConfig = GAME_CONFIG.track): number {
    return terrainSurface(x, track) === 'loose'
        ? track.looseGroundFriction
        : track.groundFriction;
}
