import { useState, type ReactElement } from 'react';

import { stageConfig, type Progress } from '@zombie-drive/shared';

import { AUDIO } from '../../audio/GameAudio';
import { SoundButton } from '../common/SoundButton';

import { introShot } from './introShot';
import { INTRO_DURATION, INTRO_FADE_DURATION, INTRO_COPY, INTRO_SOUNDS } from '../../configs/scenes/intro';
import { IntroGarage } from './IntroGarage';
import { useIntroPlayback } from './useIntroPlayback';
import { useIntroAudio } from './useIntroAudio';
import { IntroMap } from './IntroMap';

interface IntroProps {
    onFinish: () => void;
    onMusicChange: (enabled: boolean) => void;
    progress?: Progress;
}

export function Intro({ onFinish, onMusicChange, progress }: IntroProps): ReactElement {
    const playback = useIntroPlayback(onFinish);
    const shot = introShot(playback.elapsed);

    useIntroAudio({ cue: shot.cue,
        isPlaying: playback.isPlaying && !playback.isPaused,
        vehicleId: stageConfig(progress?.stageId).vehicleId,
        onMusicChange });

    return (
        <main className={`game-shell intro intro-${ shot.scene }`}
            data-paused={playback.isPaused} data-ending={playback.elapsed >= INTRO_DURATION - INTRO_FADE_DURATION}
            aria-label={INTRO_COPY.title}>
            <IntroScenery scene={shot.scene} progress={progress} />
            <div className="intro-vignette" />

            <header className="intro-toolbar"><SoundButton />
                <button className="game-button" onClick={onFinish}>Пропустить</button>
            </header>

            {playback.isPlaying ? <IntroCaption label={shot.label} text={shot.text} /> : <IntroTitle />}
            <IntroAction playback={playback} />
        </main>
    );
}

function IntroScenery({ scene, progress }: { scene: string; progress?: Progress }): ReactElement {
    return (
        <div key={scene} className={`intro-scenery intro-scenery-${ scene }`} aria-hidden="true">
            {scene === 'map' && <IntroMap />}
            {scene === 'garage' && <IntroGarage progress={progress} />}
            {scene === 'radio' && <div className="intro-transmission"><span />{INTRO_COPY.frequency}</div>}
        </div>
    );
}

function IntroTitle(): ReactElement {
    return (
        <section className="intro-title">
            <span>{INTRO_COPY.kicker}</span>
            <h1 className="orange outlined">{INTRO_COPY.title}</h1>
            <p>{INTRO_COPY.tagline}</p>
        </section>
    );
}

function IntroCaption(props: { label?: string; text?: string }): ReactElement {
    return (
        <section className="intro-caption" aria-live="polite" aria-atomic="true">
            <span>{props.label}</span>
            <p key={props.text}>{props.text}</p>
        </section>
    );
}

function IntroAction(props: {
    playback: ReturnType<typeof useIntroPlayback>;
}): ReactElement | null {
    const [ isLoading, setLoading ] = useState(false);

    if (props.playback.isPlaying && !props.playback.isPaused) {
        return null;
    }

    return (
        <div className="intro-action">
            <button className="game-button" disabled={isLoading}
                onClick={props.playback.isPlaying
                    ? props.playback.resume
                    : () => {
                        void prepareIntro(props.playback.start, setLoading);
                    }}>
                {isLoading ? 'Настраиваем приёмник…' : props.playback.isPlaying ? 'Продолжить' : 'Начать'}
            </button>
        </div>
    );
}

async function prepareIntro(start: () => void, setLoading: (loading: boolean) => void): Promise<void> {
    AUDIO.unlock();
    setLoading(true);
    await AUDIO.prepare(INTRO_SOUNDS);
    setLoading(false);
    start();
}
