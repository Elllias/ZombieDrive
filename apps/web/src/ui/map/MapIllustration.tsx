import type { ReactElement } from 'react';

import { STAGE_IDS, stageConfig, type StageId } from '@zombie-drive/shared';

import { WATER, RIVERS, ROADS } from '../../configs/worldMap';

export function MapIllustration({ isIntro = false }: { isIntro?: boolean }): ReactElement {
    const points = STAGE_IDS.map((id) => stageConfig(id).mapPosition);
    const route = `M${ points.map(({ x, y }) => `${ x * 6 } ${ y * 4.4 }`).join('L') }`;

    return (
        <svg viewBox="0 0 600 440" aria-label="Карта маршрутов" role="img">
            <path className="map-water" d={WATER} />
            <path className="map-river" d={RIVERS} />
            <path className="map-roads" d={ROADS} />
            <path className="map-route" d={route} />
            {STAGE_IDS.map((id) => <MapPoint key={id} id={id} isIntro={isIntro} />)}
        </svg>
    );
}

function MapPoint({ id, isIntro }: { id: StageId; isIntro: boolean }): ReactElement {
    const stage = stageConfig(id);
    const x = stage.mapPosition.x * 6;
    const y = stage.mapPosition.y * 4.4;

    return (
        <g data-stage={id}>
            <circle className="map-node" cx={x} cy={y} r="15" />
            <circle className="map-dot" cx={x} cy={y} r="8" />
            {isIntro && id === 'pass' && <circle className="intro-map-signal" cx={x} cy={y} r="23" />}

            {isIntro && <text className="intro-waypoint" x={x + 21} y={y + 6}>
                {stage.title.split(' ').map((word, index) => (
                    <tspan key={index} x={x + 21} dy={index === 0 ? 0 : 21}>{word}</tspan>
                ))}
            </text>}
        </g>
    );
}
