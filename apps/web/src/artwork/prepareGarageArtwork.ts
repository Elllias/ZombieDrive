import { plowAppearance, stageConfig, vehicleConfig, type Progress } from '@zombie-drive/shared';

import { GARAGE_ARTWORK } from '../configs/artwork';

import { preloadImage } from './preloadImage';
import { warmGarageArtwork } from './warmGarageArtwork';

export async function prepareGarageArtwork(progress: Progress): Promise<void> {
    if (typeof Image === 'undefined') {
        return;
    }

    const stage = stageConfig(progress.stageId);
    const vehicle = vehicleConfig(stage.vehicleId);

    const sources = [
        ...GARAGE_ARTWORK,
        vehicle.bodyArt,
        stage.backdropArt,
        `/art/wheel-${ progress.upgrades.tires }.webp`,
    ];

    if (vehicle.upgrades.includes('plow')) {
        sources.push(plowAppearance(stage.vehicleId).art);
    }

    await Promise.all(sources.map((source) => preloadImage(source)));
    warmGarageArtwork(progress);
}
