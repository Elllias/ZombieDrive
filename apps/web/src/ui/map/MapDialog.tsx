import { useState, type ReactElement } from 'react';

import { STAGE_IDS, stageConfig, type StageId, type Progress } from '@zombie-drive/shared';

import { GameDialog } from '../common/GameDialog';

import { MapIllustration } from './MapIllustration';
import { lockedStageLabel } from './MapDialog.utils';

interface MapProps {
    progress: Progress;
    isBusy: boolean;
    onSelect: (stageId: StageId) => void;
    onClose: () => void;
}

export function MapDialog(props: MapProps): ReactElement {
    const [ selected, setSelected ] = useState<StageId>(props.progress.stageId ?? 'hills');

    return (
        <GameDialog title="Карта пути" onClose={props.onClose} className="map-dialog">
            <div className="map-content">
                <div className="paper-map">
                    <MapIllustration />

                    {STAGE_IDS.map((id) => (
                        <MapNode key={id} id={id} selected={selected} onSelect={setSelected} />
                    ))}
                </div>

                <MapPostcard {...props} selected={selected} />
            </div>
        </GameDialog>
    );
}

function MapNode(props: { id: StageId; selected: StageId; onSelect: (id: StageId) => void }): ReactElement {
    const stage = stageConfig(props.id);
    const style = { left: `${ stage.mapPosition.x }%`, top: `${ stage.mapPosition.y }%` };

    return (
        <button className={`map-stage-node ${ props.selected === props.id ? 'selected' : '' }`} style={style}
            aria-pressed={props.selected === props.id} onClick={() => props.onSelect(props.id)}>
            {stage.title}
        </button>
    );
}

function MapPostcard(props: MapProps & { selected: StageId }): ReactElement {
    const stage = stageConfig(props.selected);
    const saved = props.progress.stages?.find((item) => item.stageId === stage.id);
    const unlocked = stage.id === 'hills' || !!saved;

    return (
        <section className="map-postcard">
            <img src={stage.backdropArt} alt="" />
            <h3>{stage.title}</h3>
            <p>{stage.description}</p>
            <MapAction {...props} unlocked={unlocked} />
        </section>
    );
}

function MapAction(props: MapProps & { selected: StageId; unlocked: boolean }): ReactElement {
    return (
        <button className="game-button" disabled={!props.unlocked || props.isBusy || !!props.progress.activeRun}
            onClick={() => {
                props.onSelect(props.selected);
                props.onClose();
            }}>
            {props.unlocked ? 'В гараж' : lockedStageLabel(props.selected)}
        </button>
    );
}
