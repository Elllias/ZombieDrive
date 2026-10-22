import type { CSSProperties } from 'react';

import {
    ENDING_ARRIVAL,
    ENDING_DEPARTURE,
    ENDING_GATE_OPEN,
    ENDING_STOP,
    ENDING_MOTION,
} from '../../configs/scenes/ending';

interface EndingStyle extends CSSProperties {
    '--car-x': string;
    '--wheel-angle': string;
    '--gate-angle': string;
    '--arrival-light': number;
}

export function endingMotion(elapsed: number): EndingStyle {
    const approach = progress(elapsed, 0, ENDING_STOP);
    const departure = progress(elapsed, ENDING_DEPARTURE, ENDING_ARRIVAL);

    const carX = ENDING_MOTION.carStart + ENDING_MOTION.approachTravel * approach
        + ENDING_MOTION.departureTravel * departure;

    const opening = progress(elapsed, ENDING_GATE_OPEN, ENDING_GATE_OPEN + ENDING_MOTION.gateOpenDuration);
    const closing = progress(elapsed, ENDING_ARRIVAL, ENDING_ARRIVAL + ENDING_MOTION.gateCloseDuration);

    return {
        '--car-x': `${ carX }%`,
        '--wheel-angle': `${ (carX - ENDING_MOTION.carStart) * ENDING_MOTION.wheelDegreesPerPercent }deg`,
        '--gate-angle': `${ ENDING_MOTION.gateAngle * opening * (1 - closing) }deg`,

        '--arrival-light': ENDING_MOTION.initialLight
            + progress(elapsed, ENDING_DEPARTURE, ENDING_ARRIVAL + ENDING_MOTION.lightFadeDuration)
                * ENDING_MOTION.addedLight,
    };
}

function progress(elapsed: number, start: number, end: number): number {
    return Math.max(0, Math.min(1, (elapsed - start) / (end - start)));
}
