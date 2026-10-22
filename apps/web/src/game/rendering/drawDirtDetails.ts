import type Phaser from 'phaser';

import { GAME_CONFIG, terrainHeight, terrainSurface, type TrackConfig } from '@zombie-drive/shared';

export function drawDirtDetails(
    graphics: Phaser.GameObjects.Graphics, range: { start: number; end: number }, track: TrackConfig,
): void {
    const scale = GAME_CONFIG.rendering.pixelsPerMeter;

    for (let x = Math.ceil((range.start - 0.65) / 0.65) * 0.65; x < range.end + 0.65; x += 0.65) {
        const y = terrainHeight(x, track) * scale;
        const radius = 4 + Math.abs(Math.sin(x * 13.6)) * 6;

        graphics.fillStyle(0x543518).fillEllipse(x * scale, y + 7, radius * 2.2, radius);
        graphics.fillStyle(0xb18148).fillEllipse(x * scale, y + 5, radius * 1.7, radius * 0.65);
        soilStones(graphics, { x: x * scale, y, radius });

        if (terrainSurface(x, track) === 'dirt' && Math.sin(x * 31) > 0.5) {
            grass(graphics, x * scale, y);
        }
    }
}

function soilStones(graphics: Phaser.GameObjects.Graphics, point: { x: number; y: number; radius: number }): void {
    const worldX = point.x / GAME_CONFIG.rendering.pixelsPerMeter;

    for (let row = 1; row < 7; row++) {
        const depth = 25 + row * 31 + Math.sin(worldX * 3.7 + row) * 15;

        graphics.fillStyle(row % 2 ? 0x38230e : 0x67411e, 0.5)
            .fillEllipse(point.x + row * 5, point.y + depth, point.radius * 2.4, point.radius * 0.8);
    }
}

function grass(graphics: Phaser.GameObjects.Graphics, x: number, y: number): void {
    graphics.lineStyle(2, 0x777341, 0.9);

    for (let blade = 0; blade < 4; blade++) {
        const height = 9 + Math.abs(Math.sin(x + blade)) * 15;

        graphics.lineBetween(x + blade * 3, y, x + blade * 5 - 5, y - height);
    }
}
