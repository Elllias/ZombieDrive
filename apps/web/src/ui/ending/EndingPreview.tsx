import { useState, type ReactElement } from 'react';

import { useAudioLifecycle } from '../../audio/useAudioLifecycle';
import { useMenuMusic } from '../../audio/useMenuMusic';

import { Ending } from './Ending';

export function EndingPreview(): ReactElement {
    const [ isMusicPlaying, setMusicPlaying ] = useState(false);

    useAudioLifecycle();
    useMenuMusic(isMusicPlaying);

    return <Ending onMusicChange={setMusicPlaying} onExit={exitPreview} />;
}

function exitPreview(): void {
    const url = new URL(window.location.href);

    url.searchParams.delete('scene');
    window.location.assign(url.href);
}
