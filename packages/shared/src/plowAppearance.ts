import { HAZARDS } from './configs/hazards';
import { plowPosition } from './plowPosition';
import { vehicleConfig } from './vehicleConfig';
import type { VehicleId } from './schemas';
import type { PlowAppearance } from './vehicleTypes';

export function plowAppearance(vehicleId: VehicleId = 'suv'): PlowAppearance {
    const appearance = vehicleConfig(vehicleId).plowAppearance;

    if (appearance) {
        return appearance;
    }

    const position = plowPosition(vehicleId);

    return {
        art: '/art/plow.webp',
        width: HAZARDS.plow.halfWidth * 2,
        height: HAZARDS.plow.halfHeight * 2,
        ...position,
    };
}
