import { GAME_CONFIG, terrainHeight, type TrackConfig } from '@zombie-drive/shared';

export function terrainChunkBounds(
    range: { start: number; end: number }, track: TrackConfig = GAME_CONFIG.track,
): { top: number; bottom: number } {
    const heights = [];

    for (let x = range.start; x <= range.end; x += track.sampleSpacing) {
        heights.push(terrainHeight(x, track));
    }

    return {
        top: Math.min(...heights) - GAME_CONFIG.rendering.terrainTopMargin,
        bottom: Math.max(...heights) + GAME_CONFIG.rendering.terrainDepth,
    };
}
