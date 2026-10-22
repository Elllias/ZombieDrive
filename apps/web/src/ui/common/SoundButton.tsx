import { useSyncExternalStore, type ReactElement } from 'react';

import { AUDIO } from '../../audio/GameAudio';

export function SoundButton(): ReactElement {
    const isMuted = useSyncExternalStore(AUDIO.subscribe, AUDIO.getMuted);

    return (
        <button className="game-button sound-button" aria-pressed={!isMuted}
            aria-label={isMuted ? 'Включить звук' : 'Выключить звук'} onClick={() => AUDIO.toggle()}>
            Звук: {isMuted ? 'выкл' : 'вкл'}
        </button>
    );
}
