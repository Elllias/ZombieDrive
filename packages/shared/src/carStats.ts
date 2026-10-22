import { vehicleConfig } from './vehicleConfig';
import type { VehicleId } from './schemas';
import type { CarStats, Upgrades } from './schemas';
import { carGeometry } from './carGeometry';

export function carStats(upgrades: Upgrades, vehicleId: VehicleId = 'suv'): CarStats {
    const vehicle = vehicleConfig(vehicleId);
    const settings = vehicle.settings;

    return {
        driveTorque: settings.initialTorque + upgrades.engine * settings.torquePerLevel,
        friction: settings.initialFriction + upgrades.tires * settings.frictionPerLevel,
        springFrequency: settings.initialSpring + upgrades.suspension * settings.springPerLevel,
        springDamping: settings.initialSpringDamping + upgrades.suspension * settings.springDampingPerLevel,
        fuelSeconds: settings.initialFuelSeconds + upgrades.tank * settings.fuelPerLevel,
        ...carGeometry(upgrades.tires, vehicleId),
        vehicleId,
        plowLevel: Number(vehicle.upgrades.includes('plow') && (upgrades.plow ?? 0) > 0),
    };
}
