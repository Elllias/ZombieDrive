import type Phaser from 'phaser';

import { GAME_CONFIG, terrainHeight, type TrackConfig } from '@zombie-drive/shared';

export function drawScenery(scene: Phaser.Scene, track: TrackConfig = GAME_CONFIG.track): void {
    const graphics = scene.add.graphics().setDepth(-3);
    const scale = GAME_CONFIG.rendering.pixelsPerMeter;

    for (let worldX = -5; worldX < track.length + 30; worldX += 32) {
        const x = worldX * scale;
        const y = terrainHeight(worldX, track) * scale;

        graphics.lineStyle(8, 0x29281b).lineBetween(x, y, x - 9, y - 215);
        graphics.lineStyle(2, 0x8a7650).lineBetween(x - 2, y, x - 11, y - 215);
        graphics.lineStyle(6, 0x353021).lineBetween(x - 48, y - 185, x + 44, y - 214);
        graphics.lineStyle(3, 0x413b27).lineBetween(x - 34, y - 187, x - 35, y - 218);
        graphics.lineBetween(x + 30, y - 209, x + 29, y - 237);
        wires(graphics, { x, y, nextY: terrainHeight(worldX + 32, track) * scale });
    }
}

function wires(graphics: Phaser.GameObjects.Graphics, point: { x: number; y: number; nextY: number }): void {
    const gap = 32 * GAME_CONFIG.rendering.pixelsPerMeter;

    graphics
        .lineStyle(2, 0x312d1e, 0.8)
        .beginPath()
        .moveTo(point.x, point.y - 214);

    for (let index = 1; index <= 32; index++) {
        const progress = index / 32;
        const height = point.y + (point.nextY - point.y) * progress - 214 + Math.sin(progress * Math.PI) * 65;

        graphics.lineTo(point.x + gap * progress, height);
    }

    graphics.strokePath();
}
