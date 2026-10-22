import { readFileSync } from 'node:fs';

export function engineSamples(name: string): Array<number> {
    const file = readFileSync(new URL(`../apps/web/public/audio/${ name }`, import.meta.url));
    const format = waveChunk(file, 'fmt ');
    const data = waveChunk(file, 'data');

    if (format.readUInt16LE(0) !== 1 || format.readUInt16LE(2) !== 1
        || format.readUInt32LE(4) !== 22050 || format.readUInt16LE(14) !== 16) {
        throw new Error('Expected mono 22050 Hz PCM16 engine loop');
    }

    return Array.from({ length: data.length / 2 }, (_, index) => data.readInt16LE(index * 2) / 32768);
}

function waveChunk(file: Buffer, name: string): Buffer {
    for (let offset = 12; offset + 8 <= file.length;) {
        const size = file.readUInt32LE(offset + 4);

        if (file.toString('ascii', offset, offset + 4) === name) {
            return file.subarray(offset + 8, offset + 8 + size);
        }

        offset += 8 + size + size % 2;
    }

    throw new Error(`Missing WAV chunk: ${ name }`);
}

export function rootMeanSquare(samples: ReadonlyArray<number>): number {
    return Math.sqrt(samples.reduce((sum, sample) => sum + sample * sample, 0) / samples.length);
}
