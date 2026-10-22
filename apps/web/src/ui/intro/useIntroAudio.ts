import { useEffect, useSyncExternalStore } from 'react';

import type { VehicleId } from '@zombie-drive/shared';

import { AUDIO } from '../../audio/GameAudio';
import { engineSound } from '../../audio/engineSound';
import type { SoundId } from '../../configs/audio';

import { INTRO_VOLUME } from '../../configs/scenes/intro';

import type { IntroCue } from '../../configs/scenes/types';

export function useIntroAudio(options: {
    cue: IntroCue;
    isPlaying: boolean;
    vehicleId: VehicleId;
    onMusicChange: (enabled: boolean) => void;
}): void {
    const isMuted = useSyncExternalStore(AUDIO.subscribe, AUDIO.getMuted);
    const { cue, isPlaying, vehicleId, onMusicChange } = options;

    useEffect(() => {
        onMusicChange(isPlaying && cue === 'music');

        return (): void => onMusicChange(false);
    }, [ cue, isPlaying, onMusicChange ]);

    useEffect(() => {
        if (!isPlaying || isMuted || cue === 'music') {
            return;
        }

        return playCue(cue, vehicleId);
    }, [ cue, isPlaying, vehicleId, isMuted ]);
}

function playCue(cue: Exclude<IntroCue, 'music'>, vehicleId: VehicleId): () => void {
    const sound: SoundId = cue === 'engine' ? engineSound(vehicleId) : cue;
    let isCurrent = true;
    let voice: ReturnType<typeof AUDIO.play> = null;

    void AUDIO.prepare([ sound ]).then(() => {
        if (isCurrent) {
            voice = AUDIO.play(sound, { loop: cue === 'radio' || cue === 'engine',
                volume: cue === 'radio' ? INTRO_VOLUME.radio : INTRO_VOLUME.vehicle });
        }
    });

    return (): void => {
        isCurrent = false;
        voice?.stop();
    };
}
