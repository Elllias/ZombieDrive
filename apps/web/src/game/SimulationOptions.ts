import type { BarrelSpawn, CrateSpawn, StageId, ZombieSpawn } from '@zombie-drive/shared';

export interface SimulationOptions {
    stageId?: StageId;
    isFlat?: boolean;
    spawns?: ReadonlyArray<ZombieSpawn>;
    crateSpawns?: ReadonlyArray<CrateSpawn>;
    barrelSpawns?: ReadonlyArray<BarrelSpawn>;
}
