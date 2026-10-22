import { useState, type ReactElement } from 'react';

import { useAudioLifecycle } from '../audio/useAudioLifecycle';
import { useMenuMusic } from '../audio/useMenuMusic';
import { PREFERENCES } from '../platform/preferences';
import { useAppController } from '../state/useAppController';

import { App } from './App';
import { Intro } from './intro/Intro';
import { INTRO_PREFERENCE } from '../configs/scenes/intro';
import { Ending } from './ending/Ending';
import { isEscapeResult } from './ending/isEscapeResult';

export function GameExperience(): ReactElement {
    const controller = useAppController();
    const [ showIntro, setShowIntro ] = useState(() => !PREFERENCES.read(INTRO_PREFERENCE));
    const [ sceneMusic, setSceneMusic ] = useState(false);

    const [ seenEndingRun, setSeenEndingRun ] = useState<string | null>(null);
    const state = controller.state;
    const isResultMusic = isEscapeResult(state) && seenEndingRun === state.run.id;

    useAudioLifecycle();
    useMenuMusic(sceneMusic || (!showIntro && (state.screen === 'garage' || isResultMusic)));

    if (showIntro && state.screen === 'garage') {
        return <Intro progress={state.progress}
            onMusicChange={setSceneMusic} onFinish={() => {
                PREFERENCES.write(INTRO_PREFERENCE, true);
                setShowIntro(false);
            }} />;
    }

    if (isEscapeResult(state) && seenEndingRun !== state.run.id) {
        return <Ending key={state.run.id} autoPlay exitLabel="Итоги заезда" onMusicChange={setSceneMusic}
            vehicle={{ vehicleId: state.run.stats.vehicleId,
                tireLevel: state.run.stats.tireLevel,
                plowLevel: state.run.stats.plowLevel }} onExit={() => setSeenEndingRun(state.run.id)} />;
    }

    return <App {...controller} />;
}
