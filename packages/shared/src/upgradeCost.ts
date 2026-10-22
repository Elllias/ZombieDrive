import { GAME_CONFIG } from './configs/game';
import { vehicleConfig } from './vehicleConfig';
import type { VehicleId } from './schemas';
import type { Upgrade } from './schemas';

export function upgradeCost(upgrade: Upgrade, currentLevel: number, vehicleId: VehicleId = 'suv'): number {
    return Math.ceil(
        vehicleConfig(vehicleId).baseCosts[upgrade] * GAME_CONFIG.economy.costGrowth ** currentLevel,
    );
}
