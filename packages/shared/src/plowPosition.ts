import { HAZARDS } from './configs/hazards';
import { vehicleConfig } from './vehicleConfig';
import type { VehicleId } from './schemas';

export function plowPosition(vehicleId: VehicleId = 'suv'): { x: number; y: number } {
    return {
        x: vehicleConfig(vehicleId).settings.chassisHalfWidth + HAZARDS.plow.forwardOffset,
        y: HAZARDS.plow.offsetY,
    };
}
