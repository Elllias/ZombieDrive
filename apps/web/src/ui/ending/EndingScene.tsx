import type { ComponentProps, ReactElement } from 'react';

import { Vehicle } from '../common/Vehicle';

import type { EndingPhase } from '../../configs/scenes/types';
import { ENDING_ART } from '../../configs/scenes/ending';

import { EndingBarrier } from './EndingBarrier';
import { endingMotion } from './endingMotion';

export function EndingScene(props: {
    elapsed: number; phase: EndingPhase; vehicle: ComponentProps<typeof Vehicle>;
}): ReactElement {
    return (
        <div className="ending-stage" style={endingMotion(props.elapsed)} data-phase={props.phase} aria-hidden="true">
            <img className="ending-backdrop" src={ENDING_ART.backdrop} alt="" />
            <div className="ending-sunlight" />
            <div className="ending-searchlight" />
            <div className="ending-car-shadow" />
            <div className="ending-car"><Vehicle {...props.vehicle} /><span className="ending-headlight" /></div>
            <div className="ending-dust" />
            <EndingBarrier />
        </div>
    );
}
