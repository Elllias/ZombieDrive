export class SoundVoice {
    private isStopped = false;

    constructor(
        private readonly context: AudioContext,
        private readonly source: AudioBufferSourceNode,
        private readonly gain: GainNode,
        private readonly onStop: () => void,
    ) {
        source.onended = (): void => this.disconnect();
    }

    get isPlaying(): boolean {
        return !this.isStopped;
    }

    fadeIn(volume: number, seconds: number): void {
        this.fade(volume, seconds);
    }

    fadeOut(seconds: number): void {
        if (this.isStopped) {
            return;
        }

        this.fade(0, seconds);
        this.source.stop(this.context.currentTime + seconds);
    }

    private fade(volume: number, seconds: number): void {
        if (this.isStopped) {
            return;
        }

        const now = this.context.currentTime;

        this.gain.gain.cancelScheduledValues(now);
        this.gain.gain.setValueAtTime(this.gain.gain.value, now);
        this.gain.gain.linearRampToValueAtTime(volume, now + seconds);
    }

    tune(volume: number, rate = 1): void {
        if (this.isStopped) {
            return;
        }

        const now = this.context.currentTime;

        this.gain.gain.setTargetAtTime(Math.max(0, Math.min(volume, 1)), now, 0.06);
        this.source.playbackRate.setTargetAtTime(Math.max(0.25, Math.min(rate, 3)), now, 0.08);
    }

    stop(): void {
        if (this.isStopped) {
            return;
        }

        this.source.stop();
        this.disconnect();
    }

    private disconnect(): void {
        if (this.isStopped) {
            return;
        }

        this.isStopped = true;
        this.source.disconnect();
        this.gain.disconnect();
        this.onStop();
    }
}
