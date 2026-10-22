import type { StageId, VehicleId } from './schemas';
import type { TrackConfig } from './trackTypes';

export interface CrateSpawn {
    id: string;
    x: number;
    row: number;
}

export interface ZombieSpawn {
    id: string;
    x: number;
    kind?: 'normal' | 'heavy';
}

export type BarrelSpawn = CrateSpawn;

export type GroundMaterial = 'dirt' | 'asphalt' | 'rock';

export interface StageConfig {
    id: StageId;
    title: string;
    description: string;
    vehicleId: VehicleId;
    backdropArt: string;
    groundMaterial: GroundMaterial;
    mapPosition: { x: number; y: number };
    track: TrackConfig;
    zombies: ReadonlyArray<ZombieSpawn>;
    crates: ReadonlyArray<CrateSpawn>;
    barrels: ReadonlyArray<BarrelSpawn>;
}
