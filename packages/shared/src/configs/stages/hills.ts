import { TRACK_CONFIG } from '../maps/hills';
import { ZOMBIE_SPAWNS } from '../spawns/hillsZombies';
import { CRATE_SPAWNS } from '../spawns/hillsCrates';
import type { StageConfig } from '../../stageTypes';

export const HILLS_STAGE: StageConfig = {
    id: 'hills',
    title: 'Заброшенные холмы',
    description: 'Прорвись через зомби и доберись до выхода.',
    vehicleId: 'suv',
    backdropArt: '/art/landscape.webp',
    groundMaterial: 'dirt',
    mapPosition: { x: 31, y: 32 },
    track: TRACK_CONFIG,
    zombies: ZOMBIE_SPAWNS,
    crates: CRATE_SPAWNS,
    barrels: [],
};
