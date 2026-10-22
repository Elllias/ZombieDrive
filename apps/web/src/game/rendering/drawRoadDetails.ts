import type Phaser from 'phaser';

import { GAME_CONFIG, terrainHeight, type TrackConfig } from '@zombie-drive/shared';

type RoadMaterial = 'asphalt' | 'rock';

interface RoadPaint {
    surface: ReadonlyArray<number>;
    stone: number;
    highlight: number;
    fracture: number;
}

const ROAD_PAINT: Record<RoadMaterial, RoadPaint> = {
    asphalt: { surface: [ 0x73756b, 0x2d332f, 0x9a9380 ],
        stone: 0x6c6a5d,
        highlight: 0xb0a28a,
        fracture: 0x222923 },

    rock: { surface: [ 0xc2ae8d, 0x59594c, 0x7a7864 ],
        stone: 0x817c67,
        highlight: 0xbcaa8a,
        fracture: 0x30372e },
};

export function drawRoadDetails(
    graphics: Phaser.GameObjects.Graphics, range: { start: number; end: number },
    track: TrackConfig, material: RoadMaterial,
): void {
    const paint = ROAD_PAINT[material];
    const scale = GAME_CONFIG.rendering.pixelsPerMeter;

    for (let index = Math.floor(range.start / 0.28); index <= Math.ceil(range.end / 0.28); index++) {
        const x = index * 0.28;
        const y = terrainHeight(x, track) * scale;
        const seed = noise(index, 4);

        graphics.fillStyle(paint.surface[Math.floor(seed * paint.surface.length)] ?? paint.stone, 0.65)
            .fillRect(x * scale, y + 2 + noise(index, 7) * 9, 1 + seed * 3, 1 + noise(index, 9) * 2);
    }

    rockFragments(graphics, range, track, paint);
    roadCracks(graphics, range, track, paint);
}

function rockFragments(
    graphics: Phaser.GameObjects.Graphics, range: { start: number; end: number },
    track: TrackConfig, paint: RoadPaint,
): void {
    const scale = GAME_CONFIG.rendering.pixelsPerMeter;

    for (let index = Math.floor(range.start / 0.9); index <= Math.ceil(range.end / 0.9); index++) {
        const x = (index * 0.9 + noise(index, 1) * 0.45) * scale;
        const worldX = x / scale;
        const y = terrainHeight(worldX, track) * scale + 3;
        const width = 3 + noise(index, 5) * 7;
        const depth = 3 + noise(index, 6) * 5;

        graphics.fillStyle(paint.stone).fillTriangle(x - width, y + depth, x, y, x + width, y + depth);
        graphics.lineStyle(1, paint.highlight, 0.7).lineBetween(x - width, y + depth, x, y);
        graphics.fillStyle(paint.fracture, 0.6).fillRect(x - width, y + depth, width * 2, 2);
    }
}

function roadCracks(
    graphics: Phaser.GameObjects.Graphics, range: { start: number; end: number },
    track: TrackConfig, paint: RoadPaint,
): void {
    const scale = GAME_CONFIG.rendering.pixelsPerMeter;

    for (let index = Math.floor(range.start / 3.2); index <= Math.ceil(range.end / 3.2); index++) {
        const x = index * 3.2 + noise(index, 2);
        const point = { x: x * scale, y: terrainHeight(x, track) * scale };
        const nextY = terrainHeight(x + 0.65, track) * scale;
        const depth = 30 + noise(index, 3) * 65;

        graphics.lineStyle(1.5, paint.fracture, 0.7)
            .lineBetween(point.x - 8, point.y + 3, point.x + 8, point.y + 8)
            .lineBetween(point.x + 8, point.y + 8, point.x + 35, nextY + 4);

        graphics.lineStyle(1, paint.fracture, 0.3)
            .lineBetween(point.x + 8, point.y + 16, point.x - 7, point.y + depth)
            .lineBetween(point.x - 7, point.y + depth, point.x + 17, point.y + depth + 24);
    }
}

function noise(index: number, salt: number): number {
    const value = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453;

    return value - Math.floor(value);
}
