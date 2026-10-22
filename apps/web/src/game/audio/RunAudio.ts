import { AUDIO } from '../../audio/GameAudio';
import { engineSound } from '../../audio/engineSound';
import type { SoundOptions } from '../../audio/AudioMixer';
import type { SoundVoice } from '../../audio/SoundVoice';
import type { EngineSound, SoundId } from '../../configs/audio';

import type { GameSimulation } from '../GameSimulation';
import type { Controls } from '../physics/types';

import type { RunFeedbackEvent } from '../feedback/RunFeedbackEvents';

export class RunAudio {
    private readonly effects = new Set<SoundVoice>();
    private readonly engineId: EngineSound;
    private engine: SoundVoice | null = null;
    private wind: SoundVoice | null = null;
    private wasMuted = false;
    private hadFuel = true;
    private readonly sounds: ReadonlyArray<SoundId>;

    constructor(simulation: GameSimulation) {
        const vehicleId = simulation.car.stats.vehicleId;

        this.engineId = engineSound(vehicleId);

        this.sounds = simulation.stage.barrels.length > 0 ? [ this.engineId, 'explosion' ] : [ this.engineId ];

        void AUDIO.prepare(this.sounds);
    }

    update(simulation: GameSimulation, controls: Controls, events: ReadonlyArray<RunFeedbackEvent>): void {
        if (this.wasMuted !== AUDIO.getMuted()) {
            this.stop();
            this.wasMuted = AUDIO.getMuted();
        }

        this.effects.forEach((voice) => {
            if (!voice.isPlaying) {
                this.effects.delete(voice);
            }
        });

        this.updateEngine(simulation, controls);

        events.forEach((event) => {
            this.playEffect(event.sound, event);

            if (event.sound === 'hit') {
                this.playEffect(Math.random() > 0.5 ? 'groan1' : 'groan2', {
                    volume: 0.28, rate: event.isHeavy ? 0.72 : 0.95 + Math.random() * 0.15,
                });
            }
        });
    }

    stop(): void {
        this.engine?.stop();
        this.wind?.stop();
        this.effects.forEach((voice) => voice.stop());
        this.effects.clear();
        this.engine = null;
        this.wind = null;
    }

    private playEffect(id: SoundId, options: SoundOptions): void {
        const voice = AUDIO.play(id, options);

        if (voice) {
            this.effects.add(voice);
        }
    }

    private updateEngine(simulation: GameSimulation, controls: Controls): void {
        const speed = Math.abs(simulation.car.chassis.getLinearVelocity().x);
        const hasFuel = simulation.car.fuel > 0;
        const gas = controls.gas && !controls.brake && hasFuel;
        const load = Math.min(1, speed / 20);

        this.wind ??= AUDIO.play('wind', { loop: true, volume: 0 });
        this.wind?.tune(0.025 + load * 0.08, 0.8 + load * 0.4);

        if (!hasFuel) {
            this.stopEngine();

            return;
        }

        if (!this.engine && !AUDIO.getMuted()) {
            void AUDIO.prepare(this.sounds);
        }

        this.engine ??= AUDIO.play(this.engineId, { loop: true, volume: 0 });
        this.tuneEngine(gas, load);
    }

    private stopEngine(): void {
        if (this.hadFuel) {
            this.playEffect(this.engineId, { volume: 0.18, rate: 0.55 });
            this.hadFuel = false;
        }

        this.engine?.tune(0, 0.65);
    }

    private tuneEngine(gas: boolean, load: number): void {
        const volume = gas ? 0.3 + load * 0.16 : 0.16;
        const rate = 0.8 + load * 0.65 + (gas ? 0.25 : 0);

        this.engine?.tune(volume, rate);
    }
}
