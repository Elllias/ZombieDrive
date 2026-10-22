import { SampleBank } from './SampleBank';
import { SoundVoice } from './SoundVoice';
import type { SoundId } from '../configs/audio';

export interface SoundOptions {
    volume?: number;
    rate?: number;
    loop?: boolean;
}

export class AudioMixer {
    readonly samples: SampleBank;
    private readonly output: GainNode;
    private readonly voices = new Set<SoundVoice>();

    constructor(readonly context: AudioContext) {
        this.samples = new SampleBank(context);
        this.output = context.createGain();

        const limiter = context.createDynamicsCompressor();

        this.output.gain.value = 0.65;
        limiter.threshold.value = -12;
        limiter.ratio.value = 6;
        this.output.connect(limiter);
        limiter.connect(context.destination);
    }

    play(id: SoundId, options: SoundOptions = {}): SoundVoice | null {
        const buffer = this.samples.get(id);

        if (!buffer || this.context.state !== 'running' || this.voices.size >= 14) {
            return null;
        }

        return this.createVoice(buffer, options);
    }

    private createVoice(buffer: AudioBuffer, options: SoundOptions): SoundVoice {
        const source = this.context.createBufferSource();
        const gain = this.context.createGain();
        const voice = new SoundVoice(this.context, source, gain, () => this.voices.delete(voice));

        source.buffer = buffer;
        source.loop = options.loop ?? false;
        gain.gain.value = options.loop ? 0 : options.volume ?? 0.5;
        source.playbackRate.value = options.rate ?? 1;
        source.connect(gain);
        gain.connect(this.output);
        voice.tune(options.volume ?? 0.5, options.rate ?? 1);
        this.voices.add(voice);
        source.start();

        return voice;
    }

    silence(): void {
        this.voices.forEach((voice) => voice.stop());
    }
}
