import { STAGE_IDS } from './identifiers';
import { stageConfig } from './stageConfig';
import type { VehicleId } from './schemas';
import type { StageConfig } from './stageTypes';

export function stageForVehicle(vehicleId: VehicleId = 'suv'): StageConfig {
    const id = STAGE_IDS.find((stageId) => stageConfig(stageId).vehicleId === vehicleId);

    if (!id) {
        throw new Error(`No stage configured for vehicle ${ vehicleId }`);
    }

    return stageConfig(id);
}
