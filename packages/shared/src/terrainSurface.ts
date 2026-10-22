import { GAME_CONFIG } from './configs/game';
import type { TrackConfig } from './trackTypes';

export function terrainSurface(x: number, track: TrackConfig = GAME_CONFIG.track): 'dirt' | 'loose' {
    const isLoose = track.looseSections.some((section) => x >= section.start && x < section.end);

    return isLoose ? 'loose' : 'dirt';
}
