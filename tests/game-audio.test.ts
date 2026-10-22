import { afterEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
    play: vi.fn(),
    silence: vi.fn(),
    load: vi.fn().mockResolvedValue(undefined),
    resume: vi.fn().mockResolvedValue(undefined),
    suspend: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../apps/web/src/audio/AudioMixer', () => ({
    AudioMixer: class {
        context = { resume: mocks.resume, suspend: mocks.suspend };
        samples = { load: mocks.load };
        play = mocks.play;
        silence = mocks.silence;
    },
}));

afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    vi.resetModules();
});

it('waits for a gesture, silences on hide, and requires a new gesture before playback', async (): Promise<void> => {
    vi.stubGlobal('AudioContext', class {});

    const { AUDIO } = await import('../apps/web/src/audio/GameAudio');

    expect(mocks.resume).not.toHaveBeenCalled();
    AUDIO.unlock();
    expect(mocks.resume).toHaveBeenCalledOnce();
    AUDIO.deactivate();
    AUDIO.play('hit');
    expect(mocks.silence).toHaveBeenCalledOnce();
    expect(mocks.suspend).toHaveBeenCalledOnce();
    expect(mocks.play).not.toHaveBeenCalled();
    AUDIO.unlock();
    AUDIO.play('hit');
    expect(mocks.play).toHaveBeenCalledOnce();
});

it('mutes immediately and keeps the game usable when Web Audio is unavailable', async (): Promise<void> => {
    const { AUDIO } = await import('../apps/web/src/audio/GameAudio');

    expect(() => AUDIO.unlock()).not.toThrow();
    AUDIO.toggle();
    expect(AUDIO.getMuted()).toBe(true);
    expect(AUDIO.play('explosion')).toBeNull();
    await expect(AUDIO.prepare([ 'starter' ])).resolves.toBeUndefined();
});
