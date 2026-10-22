import type { VehicleId } from '@zombie-drive/shared';

import { ENGINE_SOUNDS, type EngineSound } from '../configs/audio';

export function engineSound(vehicleId: VehicleId = 'suv'): EngineSound {
    return ENGINE_SOUNDS[vehicleId];
}
