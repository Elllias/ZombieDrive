import { vehicleConfig } from './vehicleConfig';
import type { VehicleId } from './schemas';
import type { CarStats } from './schemas';

export function carGeometry(tireLevel: number, vehicleId: VehicleId = 'suv'): Pick<CarStats, 'wheelRadius' | 'axleHeight' | 'tireLevel'> {
    const settings = vehicleConfig(vehicleId).settings;

    return {
        wheelRadius: settings.wheelRadius + tireLevel * settings.wheelRadiusPerLevel,
        axleHeight: settings.axleY + tireLevel * settings.axleHeightPerLevel,
        tireLevel,
    };
}
