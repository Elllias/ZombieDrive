import type { VehicleId } from '@zombie-drive/shared';

import { AUDIO } from '../../audio/GameAudio';
import { engineSound } from '../../audio/engineSound';
import type { SoundVoice } from '../../audio/SoundVoice';

import { ENDING_VEHICLE } from '../../configs/scenes/ending';
import type { EndingPhase } from '../../configs/scenes/types';
import { ENDING_MIX } from '../../configs/scenes/endingAudio';

export class EndingAudio {
    private phase: EndingPhase = 'approach';
    private generation = 0;
    private engine: SoundVoice | null = null;
    private wind: SoundVoice | null = null;
    private radio: SoundVoice | null = null;
    private readonly effects = new Set<SoundVoice>();
    private readonly played = new Set<EndingPhase>();

    constructor(private readonly vehicleId: VehicleId = ENDING_VEHICLE.vehicleId) {}

    start(): void {
        const generation = ++this.generation;
        const engine = engineSound(this.vehicleId);

        void AUDIO.prepare([ engine, 'wind', 'radio', 'metal', 'purchase', 'menuMusic' ]).then(() => {
            if (generation !== this.generation) {
                return;
            }

            this.engine = AUDIO.play(engine, { loop: true, volume: 0 });
            this.wind = AUDIO.play('wind', { loop: true, volume: 0.06 });
            this.radio = AUDIO.play('radio', { loop: true, volume: 0 });
            this.update(this.phase);
        });
    }

    update(phase: EndingPhase): void {
        this.phase = phase;

        const mix = ENDING_MIX[phase];

        this.engine?.tune(mix.volume, mix.rate);
        this.radio?.tune(mix.radio);

        if (this.engine && (phase === 'gate' || phase === 'safe')) {
            this.playCue(phase);
        }
    }

    stop(): void {
        this.generation += 1;
        this.engine?.stop();
        this.wind?.stop();
        this.radio?.stop();
        this.effects.forEach((voice) => voice.stop());
        this.effects.clear();
        this.engine = null;
        this.wind = null;
        this.radio = null;
    }

    private playCue(phase: 'gate' | 'safe'): void {
        if (this.played.has(phase)) {
            return;
        }

        const voice = AUDIO.play(phase === 'gate' ? 'metal' : 'purchase', { volume: 0.22 });

        if (voice) {
            this.effects.add(voice);
            this.played.add(phase);
        }
    }
}
