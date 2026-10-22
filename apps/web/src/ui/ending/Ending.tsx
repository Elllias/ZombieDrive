import { useEffect, useState, type ComponentProps, type ReactElement } from 'react';

import { SoundButton } from '../common/SoundButton';
import type { Vehicle } from '../common/Vehicle';

import { ENDING_DURATION, ENDING_VEHICLE, ENDING_COPY } from '../../configs/scenes/ending';
import { EndingMovie } from './EndingMovie';
import { EndingScene } from './EndingScene';

interface EndingProps {
    onExit: () => void;
    onMusicChange: (enabled: boolean) => void;
    vehicle?: ComponentProps<typeof Vehicle>;
    autoPlay?: boolean;
    exitLabel?: string;
}

export function Ending({ vehicle = ENDING_VEHICLE, ...props }: EndingProps): ReactElement {
    const [ isComplete, setComplete ] = useState(false);
    const [ attempt, setAttempt ] = useState(0);

    useEffect(() => {
        props.onMusicChange(isComplete);

        return (): void => props.onMusicChange(false);
    }, [ isComplete, props.onMusicChange ]);

    if (!isComplete) {
        return <EndingMovie key={attempt} vehicle={vehicle} autoPlay={props.autoPlay || attempt > 0}
            onFinish={() => setComplete(true)} />;
    }

    return <EndingCard {...props} vehicle={vehicle} onReplay={() => {
        setAttempt(attempt + 1);
        setComplete(false);
    }} />;
}

function EndingCard(props: EndingProps & {
    onReplay: () => void; vehicle: ComponentProps<typeof Vehicle>;
}): ReactElement {
    return (
        <main className="game-shell ending ending-complete" aria-label={ENDING_COPY.victory.label}>
            <EndingScene elapsed={ENDING_DURATION} phase="safe" vehicle={props.vehicle} />
            <div className="ending-shade" />
            <header className="intro-toolbar"><SoundButton /></header>

            <section className="ending-victory">
                <span className="ending-stamp">{ENDING_COPY.victory.stamp}</span>
                <h1 className="outlined">{ENDING_COPY.victory.title}</h1>
                <p>{ENDING_COPY.victory.description}</p>
                <span className="ending-thanks">{ENDING_COPY.victory.thanks}</span>

                <div className="ending-actions">
                    <button className="game-button" autoFocus onClick={props.onExit}>{props.exitLabel ?? 'В игру'}</button>
                    <button className="ending-replay" onClick={props.onReplay}>Посмотреть ещё раз</button>
                </div>
            </section>
        </main>
    );
}
