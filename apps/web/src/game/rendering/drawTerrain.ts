import type Phaser from 'phaser';

import { GAME_CONFIG, stageConfig, terrainHeight, type StageConfig, type TrackConfig } from '@zombie-drive/shared';

import { terrainChunkBounds } from './terrainChunkBounds';
import { drawLooseGround } from './drawLooseGround';
import { drawDirtDetails } from './drawDirtDetails';
import { drawRoadDetails } from './drawRoadDetails';
import { TERRAIN_THEMES, type SoilLayer, type TerrainTheme } from '../../configs/terrain';
import { applyTerrainTexture } from './applyTerrainTexture';

export function drawTerrainChunk(
    scene: Phaser.Scene,
    range: {
        start: number;
        end: number;
        key: string;
    },
    stage: StageConfig = stageConfig(),
): Phaser.GameObjects.Image {
    const scale = GAME_CONFIG.rendering.pixelsPerMeter;
    const theme = TERRAIN_THEMES[stage.groundMaterial];
    const bounds = terrainChunkBounds(range, stage.track);
    const top = bounds.top * scale;
    const width = Math.ceil((range.end - range.start) * scale);
    const height = Math.ceil((bounds.bottom - bounds.top) * scale);
    const graphics = scene.add.graphics();

    graphics.translateCanvas(-range.start * scale, -top);
    paintGround(graphics, { ...range, bottom: bounds.bottom }, stage, theme);
    graphics.generateTexture(range.key, width, height).destroy();
    applyTerrainTexture(scene, { key: range.key, x: range.start * scale, y: top }, theme);

    return scene.add
        .image(range.start * scale, top, range.key)
        .setOrigin(0)
        .setDepth(-2);
}

function paintGround(
    graphics: Phaser.GameObjects.Graphics, range: { start: number; end: number; bottom: number },
    stage: StageConfig, theme: TerrainTheme,
): void {
    const track = stage.track;

    drawSoil(graphics, range, track, theme);

    if (stage.groundMaterial === 'dirt') {
        drawDirtDetails(graphics, range, track);
    } else {
        drawRoadDetails(graphics, range, track, stage.groundMaterial);
    }

    drawLooseGround(graphics, range, track, theme);
}

function drawSoil(
    graphics: Phaser.GameObjects.Graphics,
    range: { start: number; end: number; bottom: number },
    track: TrackConfig,
    theme: TerrainTheme,
): void {
    theme.layers.forEach((layer): void => soilLayer(graphics, layer, range, track));
}

function soilLayer(
    graphics: Phaser.GameObjects.Graphics,
    options: SoilLayer,
    range: { start: number; end: number; bottom: number },
    track: TrackConfig,
): void {
    const scale = GAME_CONFIG.rendering.pixelsPerMeter;

    graphics
        .fillStyle(options.color)
        .beginPath()
        .moveTo(range.start * scale, range.bottom * scale);

    for (let x = range.start; x <= range.end; x += track.sampleSpacing) {
        const depth = terrainHeight(x, track) + options.offset + Math.sin(x * 0.55) * options.wave;

        graphics.lineTo(x * scale, depth * scale);
    }

    graphics
        .lineTo(range.end * scale, range.bottom * scale)
        .closePath()
        .fillPath();
}

export function drawFinish(graphics: Phaser.GameObjects.Graphics, track: TrackConfig = GAME_CONFIG.track): void {
    const scale = GAME_CONFIG.rendering.pixelsPerMeter;
    const x = (track.length + GAME_CONFIG.car.startX) * scale;
    const y = terrainHeight(track.length + GAME_CONFIG.car.startX, track) * scale;

    graphics.lineStyle(6, 0x2d271b).lineBetween(x, y, x, y - 140);
    graphics.lineStyle(2, 0x9d8763).lineBetween(x - 1, y, x - 1, y - 140);
    graphics.fillStyle(0xdfc996).fillRect(x, y - 140, 48, 32);

    for (let row = 0; row < 4; row++) {
        for (let column = 0; column < 6; column++) {
            if ((row + column) % 2 === 0) {
                graphics.fillStyle(0x322b1d).fillRect(x + column * 8, y - 140 + row * 8, 8, 8);
            }
        }
    }
}
