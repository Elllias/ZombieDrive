import { expect, it } from 'vitest';

import { engineSamples, rootMeanSquare } from './engine-loops.helpers';
import { enginePitch } from './engine-pitch.helpers';

const WINDOW_FRAMES = 220;

it.each([ 'engine-suv.wav', 'engine-r8.wav' ])('keeps %s audible across the loop seam', (name): void => {
    const samples = engineSamples(name);
    const seam = [ ...samples.slice(-WINDOW_FRAMES), ...samples.slice(0, WINDOW_FRAMES * 2) ];

    const windows = Array.from({ length: WINDOW_FRAMES * 2 + 1 }, (_, offset) =>
        rootMeanSquare(seam.slice(offset, offset + WINDOW_FRAMES)),
    );

    const minimumVolume = Math.min(...windows) / rootMeanSquare(samples);

    // A short phase-cancelling overlap caused an audible pause on every engine cycle.
    expect(minimumVolume).toBeGreaterThan(0.7);
    expect(Math.max(...samples.map(Math.abs))).toBeLessThan(0.9);
});

it.each([ 'engine-suv.wav', 'engine-r8.wav' ])('keeps a steady pitch throughout %s at a fixed playback rate', (name): void => {
    const samples = engineSamples(name);
    const windowFrames = 4096;
    const count = Math.floor(samples.length / windowFrames);

    const pitches = Array.from({ length: count }, (_, index) =>
        enginePitch(samples.slice(index * windowFrames, (index + 1) * windowFrames)),
    );

    // A prerecorded RPM ramp sounds like a repeated gear change even with a perfect seam.
    expect(count).toBeGreaterThanOrEqual(3);
    expect(Math.max(...pitches) / Math.min(...pitches)).toBeLessThan(1.005);
});
