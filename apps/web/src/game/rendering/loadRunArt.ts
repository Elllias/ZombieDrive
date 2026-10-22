import type Phaser from 'phaser';

import { plowAppearance, vehicleConfig, type CarStats, type StageConfig } from '@zombie-drive/shared';

import { ART } from '../../configs/art';
import { TERRAIN_THEMES } from '../../configs/terrain';

export function loadRunArt(scene: Phaser.Scene, stage: StageConfig, stats: CarStats): ReadonlyArray<string> {
    const images = runImages(stage, stats);

    images.forEach(({ key, url }): void => {
        scene.load.image(key, url);
    });

    return images.map(({ key }) => key);
}

function runImages(stage: StageConfig, stats: CarStats): Array<{ key: string; url: string }> {
    const images = [
        { key: 'landscape', url: stage.backdropArt },
        { key: 'car', url: vehicleConfig(stats.vehicleId).bodyArt },
        { key: 'zombie', url: ART.zombie },
        { key: `wheel-${ stats.tireLevel }`, url: `/art/wheel-${ stats.tireLevel }.webp` },
        ...groundImages(stage),
    ];

    if (stage.crates.length > 0) {
        images.push({ key: 'crate', url: '/art/crate.webp' });
    }

    if (stage.barrels.length > 0) {
        images.push({ key: 'barrel', url: '/art/barrel.webp' });
    }

    if (stats.plowLevel) {
        images.push({ key: 'plow', url: plowAppearance(stats.vehicleId).art });
    }

    return images;
}

function groundImages(stage: StageConfig): Array<{ key: string; url: string }> {
    const texture = TERRAIN_THEMES[stage.groundMaterial].texture;

    return texture
        ? [ { key: 'ground-material', url: texture.art } ]
        : [];
}
