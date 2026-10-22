import { useState, type ComponentProps, type ReactElement } from 'react';

import { AUDIO } from '../../audio/GameAudio';
import { SoundButton } from '../common/SoundButton';
import type { Vehicle } from '../common/Vehicle';
import { useCutscenePlayback } from '../cutscene/useCutscenePlayback';

import { ENDING_DURATION, ENDING_COPY, ENDING_SOUNDS } from '../../configs/scenes/ending';
import { EndingScene } from './EndingScene';
import { endingShot } from './endingShot';
import { useEndingAudio } from './useEndingAudio';

export function EndingMovie(props: {
    vehicle: ComponentProps<typeof Vehicle>; onFinish: () => void; autoPlay?: boolean;
}): ReactElement {
    const playback = useCutscenePlayback({
        duration: ENDING_DURATION, onFinish: props.onFinish, autoPlay: props.autoPlay,
    });

    const shot = endingShot(playback.elapsed);

    useEndingAudio(shot.phase, playback.isPlaying && !playback.isPaused, props.vehicle.vehicleId);

    return (
        <main className="game-shell ending" aria-label={ENDING_COPY.title} data-paused={playback.isPaused}>
            <EndingScene elapsed={playback.elapsed} phase={shot.phase} vehicle={props.vehicle} />
            <div className="ending-shade" />

            <header className="intro-toolbar"><SoundButton />
                <button className="game-button" onClick={props.onFinish}>Пропустить</button>
            </header>

            {playback.isPlaying
                ? <section className="ending-caption" aria-live="polite" aria-atomic="true">
                    <span>{shot.label}</span><p>{shot.text}</p>
                </section>
                : <section className="ending-title"><span>{ENDING_COPY.chapter}</span>
                    <h1 className="outlined">{ENDING_COPY.title}</h1><p>{ENDING_COPY.subtitle}</p></section>}

            <EndingAction playback={playback} />
        </main>
    );
}

function EndingAction({ playback }: { playback: ReturnType<typeof useCutscenePlayback> }): ReactElement | null {
    const [ isLoading, setLoading ] = useState(false);

    if (playback.isPlaying && !playback.isPaused) {
        return null;
    }

    return <div className="ending-start"><button className="game-button" disabled={isLoading}
        onClick={() => { void startEnding(playback, setLoading); }}>
        {isLoading ? 'Готовим сцену…' : playback.isPlaying ? 'Продолжить' : 'Смотреть финал'}
    </button></div>;
}

async function startEnding(
    playback: ReturnType<typeof useCutscenePlayback>, setLoading: (value: boolean) => void,
): Promise<void> {
    AUDIO.unlock();
    setLoading(true);
    await AUDIO.prepare(ENDING_SOUNDS);
    setLoading(false);

    if (playback.isPlaying) {
        playback.resume();
    } else {
        playback.start();
    }
}
