import { GAME_CONFIG } from '@zombie-drive/shared';

export function runViewport(size: { width: number; height: number }): { width: number; height: number; zoom: number } {
    const height = GAME_CONFIG.rendering.height;
    const zoom = Math.max(1, size.height) / height;

    return { width: Math.max(1, size.width) / zoom, height, zoom };
}
