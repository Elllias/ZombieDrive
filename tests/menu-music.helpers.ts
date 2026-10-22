import { vi, type Mocked } from 'vitest';

import type { MenuMusic } from '../apps/web/src/audio/MenuMusic';

type MenuAudio = ConstructorParameters<typeof MenuMusic>[0];
type MusicVoice = NonNullable<ReturnType<MenuAudio['play']>>;

interface MusicFixture {
    audio: Mocked<MenuAudio>;
    voice: Omit<Mocked<MusicVoice>, 'isPlaying'> & { isPlaying: boolean };
    emit: () => void;
}

export function musicFixture(): MusicFixture {
    const listeners = new Set<() => void>();

    const voice = { isPlaying: true,
        stop: vi.fn<MusicVoice['stop']>(),
        fadeIn: vi.fn<MusicVoice['fadeIn']>(),
        fadeOut: vi.fn<MusicVoice['fadeOut']>() };

    const audio = {
        subscribe: vi.fn<MenuAudio['subscribe']>((listener) => {
            listeners.add(listener);

            return (): void => {
                listeners.delete(listener);
            };
        }),

        isAudible: vi.fn<MenuAudio['isAudible']>(() => true),
        prepare: vi.fn<MenuAudio['prepare']>(async () => undefined),
        play: vi.fn<MenuAudio['play']>(() => voice),
    };

    return { audio, voice, emit: (): void => listeners.forEach((listener) => listener()) };
}
