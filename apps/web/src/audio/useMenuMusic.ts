import { useEffect } from 'react';

import { AUDIO } from './GameAudio';
import { MenuMusic } from './MenuMusic';

export function useMenuMusic(isEnabled: boolean): void {
    useEffect(() => {
        const music = new MenuMusic(AUDIO);

        music.setEnabled(isEnabled);

        return (): void => music.destroy();
    }, [ isEnabled ]);
}
