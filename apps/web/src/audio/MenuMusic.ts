import type { SoundOptions } from './AudioMixer';
import type { SoundId } from '../configs/audio';
import type { SoundVoice } from './SoundVoice';

type MusicVoice = Pick<SoundVoice, 'isPlaying' | 'stop' | 'fadeIn' | 'fadeOut'>;

interface MenuAudio {
    subscribe: (listener: () => void) => () => void;
    isAudible: () => boolean;
    prepare: (ids: ReadonlyArray<SoundId>) => Promise<void>;
    play: (id: SoundId, options: SoundOptions) => MusicVoice | null;
}

export class MenuMusic {
    private voice: MusicVoice | null = null;
    private enabled = false;
    private pending = false;
    private generation = 0;
    private readonly unsubscribe: () => void;

    constructor(private readonly audio: MenuAudio) {
        this.unsubscribe = audio.subscribe(this.refresh);
    }

    setEnabled(enabled: boolean): void {
        this.enabled = enabled;
        this.generation++;
        this.refresh();
    }

    destroy(): void {
        this.unsubscribe();
        this.setEnabled(false);
    }

    private refresh = (): void => {
        if (!this.enabled || !this.audio.isAudible()) {
            this.voice?.fadeOut(0.25);
            this.voice = null;

            return;
        }

        if (this.voice?.isPlaying || this.pending) {
            return;
        }

        this.pending = true;

        const generation = this.generation;

        void this.audio.prepare([ 'menuMusic' ]).then(() => this.playPrepared(generation)).finally(() => {
            this.pending = false;

            if (generation !== this.generation && this.enabled) {
                this.refresh();
            }
        });
    };

    private playPrepared(generation: number): void {
        if (!this.enabled || !this.audio.isAudible() || generation !== this.generation) {
            return;
        }

        this.voice = this.audio.play('menuMusic', { loop: true, volume: 0 });
        this.voice?.fadeIn(0.16, 1.2);
    }
}
