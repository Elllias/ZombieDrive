import type Phaser from 'phaser';

import type { TerrainTheme } from '../../configs/terrain';

interface TextureRegion {
    key: string;
    x: number;
    y: number;
}

export function applyTerrainTexture(scene: Phaser.Scene, region: TextureRegion, theme: TerrainTheme): void {
    const texture = scene.textures.get(region.key);
    const canvas = texture.getSourceImage();

    if (!theme.texture || !(canvas instanceof HTMLCanvasElement)) {
        return;
    }

    const source = scene.textures.get('ground-material').getSourceImage();

    if (!(source instanceof HTMLImageElement)) {
        return;
    }

    const context = canvas.getContext('2d');
    const pattern = context?.createPattern(source, 'repeat');

    if (!context || !pattern) {
        return;
    }

    blendPattern(context, pattern, region, theme.texture.opacity);
    texture.source[0]?.update();
}

function blendPattern(
    context: CanvasRenderingContext2D, pattern: CanvasPattern, region: TextureRegion, opacity: number,
): void {
    context.save();
    context.globalCompositeOperation = 'source-atop';
    context.globalAlpha = opacity;
    // Anchor grain in world coordinates so adjacent cached chunks share the same texture phase.
    context.translate(-region.x, -region.y);
    context.fillStyle = pattern;
    context.fillRect(region.x, region.y, context.canvas.width, context.canvas.height);
    context.restore();
}
