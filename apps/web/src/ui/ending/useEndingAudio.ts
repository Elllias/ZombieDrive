import { useEffect, useMemo, useSyncExternalStore } from 'react';

import type { VehicleId } from '@zombie-drive/shared';

import { AUDIO } from '../../audio/GameAudio';

import type { EndingPhase } from '../../configs/scenes/types';
import { EndingAudio } from './EndingAudio';

export function useEndingAudio(phase: EndingPhase, isPlaying: boolean, vehicleId?: VehicleId): void {
    const audio = useMemo(() => new EndingAudio(vehicleId), [ vehicleId ]);
    const isAudible = useSyncExternalStore(AUDIO.subscribe, () => AUDIO.isAudible(), () => false);

    useEffect(() => {
        if (isPlaying && isAudible) {
            audio.start();
        }

        return (): void => audio.stop();
    }, [ audio, isPlaying, isAudible ]);

    useEffect(() => audio.update(phase), [ audio, phase ]);
}
