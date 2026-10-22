import { stageConfig, vehicleConfig, type Progress } from '@zombie-drive/shared';

import { preloadImage } from './preloadImage';

export function warmGarageArtwork(progress: Progress): void {
    const otherStages = progress.stages?.filter((stage) => stage.stageId !== (progress.stageId ?? 'hills')) ?? [];

    for (const saved of otherStages) {
        const vehicle = vehicleConfig(stageConfig(saved.stageId).vehicleId);

        void preloadImage(vehicle.bodyArt, 'low').catch((): undefined => undefined);
    }
}
