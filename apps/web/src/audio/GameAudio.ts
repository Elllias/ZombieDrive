import { PREFERENCES } from '../platform/preferences';

import { AudioMixer, type SoundOptions } from './AudioMixer';
import { COMMON_SOUNDS, type SoundId } from '../configs/audio';
import type { SoundVoice } from './SoundVoice';

class GameAudio {
    private mixer: AudioMixer | null = null;
    private isMuted = PREFERENCES.read('muted');
    private isActive = true;
    private readonly listeners = new Set<() => void>();

    getMuted = (): boolean => this.isMuted;

    subscribe = (listener: () => void): (() => void) => {
        this.listeners.add(listener);

        return (): void => {
            this.listeners.delete(listener);
        };
    };

    unlock(): void {
        this.isActive = true;

        if (this.isMuted) {
            return;
        }

        try {
            this.mixer ??= new AudioMixer(new AudioContext());
            void this.mixer.context.resume().then(() => this.notify()).catch(() => undefined);
            void this.prepare(COMMON_SOUNDS);
        } catch {
            // Web Audio is optional on unsupported devices.
        }
    }

    isAudible(): boolean {
        return !this.isMuted && this.isActive && this.mixer?.context.state === 'running';
    }

    async prepare(ids: ReadonlyArray<SoundId>): Promise<void> {
        await this.mixer?.samples.load(ids);
    }

    play(id: SoundId, options?: SoundOptions): SoundVoice | null {
        if (this.isMuted || !this.isActive) {
            return null;
        }

        return this.mixer?.play(id, options) ?? null;
    }

    toggle(): void {
        this.isMuted = !this.isMuted;
        PREFERENCES.write('muted', this.isMuted);

        if (this.isMuted) {
            this.silence();
        } else {
            this.unlock();
        }

        this.notify();
    }

    silence(): void {
        this.mixer?.silence();
    }

    deactivate(): void {
        this.isActive = false;
        this.silence();
        this.notify();
        void this.mixer?.context.suspend().catch(() => undefined);
    }

    private notify(): void {
        this.listeners.forEach((listener) => listener());
    }
}

export const AUDIO = new GameAudio();
