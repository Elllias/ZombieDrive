import type Phaser from 'phaser';

import { GAME_CONFIG, terrainHeight, type TrackConfig } from '@zombie-drive/shared';

import { TERRAIN_THEMES, type TerrainTheme } from '../../configs/terrain';

export function drawLooseGround(
    graphics: Phaser.GameObjects.Graphics,
    range: { start: number; end: number },
    track: TrackConfig = GAME_CONFIG.track,
    theme: TerrainTheme = TERRAIN_THEMES.dirt,
): void {
    const scale = GAME_CONFIG.rendering.pixelsPerMeter;

    for (let x = range.start; x < range.end; x += 0.24) {
        const patch = track.looseSections.find((section) => x >= section.start && x < section.end);

        if (!patch) {
            continue;
        }

        const fade = Math.min(1, (x - patch.start) / 2, (patch.end - x) / 2);
        const y = terrainHeight(x, track) * scale;
        const width = 9 + Math.abs(Math.sin(x * 9.1)) * 15;
        const depth = 4 + Math.abs(Math.sin(x * 12.7)) * 7;

        graphics.fillStyle(theme.loose.shadow, fade * 0.65).fillEllipse(x * scale, y + depth, width, depth * 1.6);
        graphics.fillStyle(theme.loose.stone, fade * 0.4).fillEllipse(x * scale + 4, y + depth / 2, width * 0.65, 3);
        drawRuts(graphics, { x, y, fade }, theme);
    }
}

function drawRuts(
    graphics: Phaser.GameObjects.Graphics, point: { x: number; y: number; fade: number }, theme: TerrainTheme,
): void {
    const x = point.x * GAME_CONFIG.rendering.pixelsPerMeter;
    const offset = Math.sin(point.x * 1.8) * 2;

    graphics.fillStyle(theme.loose.rut, point.fade * 0.6).fillEllipse(x, point.y + 6 + offset, 11, 2);
    graphics.fillStyle(theme.loose.highlight, point.fade * 0.3).fillEllipse(x + 2, point.y + 9 + offset, 7, 1);
}
