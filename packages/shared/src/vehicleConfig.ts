import type { VehicleId } from './schemas';
import type { VehicleConfig } from './vehicleTypes';
import { VEHICLES } from './configs/vehicles';

export function vehicleConfig(vehicleId: VehicleId = 'suv'): VehicleConfig {
    return VEHICLES[vehicleId];
}
