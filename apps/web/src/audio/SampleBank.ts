import { AUDIO_FILES, type SoundId } from '../configs/audio';

export class SampleBank {
    private readonly buffers = new Map<SoundId, AudioBuffer>();
    private readonly pending = new Map<SoundId, Promise<void>>();

    constructor(private readonly context: AudioContext) {}

    get(id: SoundId): AudioBuffer | undefined {
        return this.buffers.get(id);
    }

    load(ids: ReadonlyArray<SoundId>): Promise<unknown> {
        return Promise.all(ids.map((id) => this.loadOne(id)));
    }

    private loadOne(id: SoundId): Promise<void> {
        if (this.buffers.has(id)) {
            return Promise.resolve();
        }

        const pending = this.pending.get(id);

        if (pending) {
            return pending;
        }

        const request = this.fetchBuffer(id).finally(() => this.pending.delete(id));

        this.pending.set(id, request);

        return request;
    }

    private async fetchBuffer(id: SoundId): Promise<void> {
        try {
            const response = await fetch(`/audio/${ AUDIO_FILES[id] }`, { signal: AbortSignal.timeout(8000) });

            if (!response.ok) {
                throw new Error(`Audio HTTP ${ response.status }`);
            }

            const buffer = await this.context.decodeAudioData(await response.arrayBuffer());

            this.buffers.set(id, buffer);
        } catch {
            // A missing optional sound must never block a run or its settlement.
        }
    }
}
