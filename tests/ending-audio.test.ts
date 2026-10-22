import { afterEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
    const voices = Array.from({ length: 5 }, () => ({ stop: vi.fn(), tune: vi.fn() }));

    return { voices,
        prepare: vi.fn(() => Promise.resolve()),
        play: vi.fn(),
        silence: vi.fn() };
});

vi.mock('../apps/web/src/audio/GameAudio', () => ({
    AUDIO: { prepare: mocks.prepare, play: mocks.play, silence: mocks.silence },
}));

import { EndingAudio } from '../apps/web/src/ui/ending/EndingAudio';

afterEach((): void => {
    vi.clearAllMocks();
});

function preparedAudio(): EndingAudio {
    mocks.play.mockImplementation(() => mocks.voices[0] ?? null);

    return new EndingAudio();
}

it('keeps the engine voice running across the radio, gate and departure', async (): Promise<void> => {
    const audio = preparedAudio();

    audio.start();
    await Promise.resolve();
    audio.update('radio');
    audio.update('gate');
    audio.update('departure');
    audio.update('safe');

    expect(mocks.play.mock.calls.filter(([ id ]) => id === 'engineR8')).toHaveLength(1);
    expect(mocks.voices[0]?.tune).toHaveBeenCalledWith(0.12, 0.8);
    expect(mocks.voices[0]?.tune).toHaveBeenCalledWith(0.32, 1.4);
    audio.stop();
    expect(mocks.silence).not.toHaveBeenCalled();
});

it('cancels sounds that finish loading after skipping the movie', async (): Promise<void> => {
    let resolve = (): void => {};

    const promise = new Promise<void>((complete) => {
        resolve = complete;
    });

    const audio = preparedAudio();

    mocks.prepare.mockReturnValueOnce(promise);
    audio.start();
    audio.stop();
    resolve();
    await promise;

    expect(mocks.play).not.toHaveBeenCalled();
});

it('does not replay the barrier clang after pausing and resuming its shot', async (): Promise<void> => {
    const audio = preparedAudio();

    audio.update('gate');
    audio.start();
    await Promise.resolve();
    audio.stop();
    audio.start();
    await Promise.resolve();

    expect(mocks.play.mock.calls.filter(([ id ]) => id === 'metal')).toHaveLength(1);
    audio.stop();
});
