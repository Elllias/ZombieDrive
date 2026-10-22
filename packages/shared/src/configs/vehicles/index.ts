import type { VehicleId } from '../../schemas';
import type { VehicleConfig } from '../../vehicleTypes';
import { SUV_VEHICLE } from './suv';
import { TRUCK_VEHICLE } from './truck';
import { R8_VEHICLE } from './r8';

export const VEHICLES: Record<VehicleId, VehicleConfig> = {
    suv: SUV_VEHICLE,
    truck: TRUCK_VEHICLE,
    r8: R8_VEHICLE,
};

