import { GAME_CONFIG } from './configs/game';
import type { TrackConfig } from './trackTypes';

export function terrainHeight(x: number, track: TrackConfig = GAME_CONFIG.track): number {
    const profile = track.heightProfile;
    const first = profile[0];
    const last = profile[profile.length - 1];

    if (!first || !last) {
        throw new Error('Terrain profile must contain points');
    }

    if (x <= first.x) {
        return track.floorY + first.height;
    }

    const index = profile.findIndex((point) => point.x >= x);
    const next = profile[index];
    const previous = profile[index - 1];

    if (!next || !previous) {
        return track.floorY + last.height;
    }

    const progress = (x - previous.x) / (next.x - previous.x);

    return track.floorY + previous.height + (next.height - previous.height) * progress;
}
