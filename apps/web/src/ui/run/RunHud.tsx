import type { ReactElement } from 'react';

import { stageConfig, type StageId } from '@zombie-drive/shared';

import type { GameSnapshot } from '../../game/GameBridge';

import { Gauge } from './Gauge';

interface RunHudProps {
    snapshot: GameSnapshot;
    onPause: () => void;
    stageId?: StageId;
}

export function RunHud(props: RunHudProps): ReactElement {
    const state = props.snapshot;

    return (
        <>
            <header className="run-hud">
                <div className="hud-kills metal-panel" role="group" aria-label="Убито зомби">
                    <span aria-hidden="true">☠</span>
                    <strong>{state.kills}</strong>
                    <small>УБИТО</small>
                </div>

                <RouteProgress distance={state.distance} stageId={props.stageId} />
                <PauseButton snapshot={state} onPause={props.onPause} />
            </header>

            <div className="dashboard">
                <Gauge kind="fuel" value={state.fuelRatio} />
                <Gauge kind="speed" value={state.speed} />
            </div>
        </>
    );
}

function PauseButton(props: RunHudProps): ReactElement {
    return (
        <button
            className="game-button pause-button"
            disabled={props.snapshot.isPaused || props.snapshot.report !== null}
            aria-label="Приостановить заезд"
            onClick={props.onPause}
        >
            Ⅱ
        </button>
    );
}

function RouteProgress({ distance, stageId }: Pick<GameSnapshot, 'distance'> & { stageId?: StageId }): ReactElement {
    const length = stageConfig(stageId).track.length;

    return (
        <div className="hud-route">
            <progress value={distance} max={length} aria-label="Расстояние до финиша" />

            <span>
                {Math.floor(distance)} / {length} м
            </span>
        </div>
    );
}
