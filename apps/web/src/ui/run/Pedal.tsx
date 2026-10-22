import type { ReactElement } from 'react';

import type { PedalProps } from './Pedal.types';
import { pedalEvents } from './Pedal.utils';
import { PEDAL_LABELS } from '../../configs/controls';
import { TiltIcon } from './TiltIcon';

export function Pedal(props: PedalProps): ReactElement {
    return (
        <button
            className={`pedal ${ props.action }`}
            aria-label={PEDAL_LABELS[props.action]}
            {...pedalEvents(props)}
        >
            <strong>
                {props.action === 'tiltLeft' || props.action === 'tiltRight'
                    ? (
                        <TiltIcon direction={props.action} />
                    )
                    : (
                        props.label
                    )}
            </strong>
        </button>
    );
}
