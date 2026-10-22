import { expect, it, vi } from 'vitest';

import { MenuMusic } from '../apps/web/src/audio/MenuMusic';

import { musicFixture } from './menu-music.helpers';

it('waits for a gesture and keeps the same loop across the intro-to-menu handoff', async (): Promise<void> => {
    const { audio, voice, emit } = musicFixture();
    const music = new MenuMusic(audio);

    audio.isAudible.mockReturnValue(false);
    music.setEnabled(true);
    expect(audio.play).not.toHaveBeenCalled();
    audio.isAudible.mockReturnValue(true);
    emit();
    await vi.waitFor(() => expect(audio.play).toHaveBeenCalledOnce());
    expect(voice.fadeIn).toHaveBeenCalledWith(0.16, 1.2);
    music.setEnabled(true);
    emit();
    expect(audio.play).toHaveBeenCalledOnce();
    music.destroy();
});

it('does not start a late download after a run has replaced the menu', async (): Promise<void> => {
    const { audio } = musicFixture();
    const music = new MenuMusic(audio);
    let complete = (): void => undefined;

    const pending = new Promise<void>((resolve) => {
        complete = resolve;
    });

    audio.prepare.mockReturnValue(pending);
    music.setEnabled(true);
    music.setEnabled(false);
    complete();
    await pending;
    await Promise.resolve();
    expect(audio.play).not.toHaveBeenCalled();
    music.destroy();
});

it('recovers when the menu returns while its first download is still pending', async (): Promise<void> => {
    const { audio } = musicFixture();
    const music = new MenuMusic(audio);
    let complete = (): void => undefined;

    const pending = new Promise<void>((resolve) => {
        complete = resolve;
    });

    audio.prepare.mockReturnValueOnce(pending);
    music.setEnabled(true);
    music.setEnabled(false);
    music.setEnabled(true);
    complete();
    await vi.waitFor(() => expect(audio.play).toHaveBeenCalledOnce());
    music.destroy();
});

it('restarts only after sound is available again and releases its subscription', async (): Promise<void> => {
    const { audio, voice, emit } = musicFixture();
    const music = new MenuMusic(audio);

    music.setEnabled(true);
    await vi.waitFor(() => expect(audio.play).toHaveBeenCalledOnce());
    voice.isPlaying = false;
    audio.isAudible.mockReturnValue(false);
    emit();
    audio.isAudible.mockReturnValue(true);
    emit();
    await vi.waitFor(() => expect(audio.play).toHaveBeenCalledTimes(2));
    music.destroy();
    emit();
    expect(audio.play).toHaveBeenCalledTimes(2);
});
