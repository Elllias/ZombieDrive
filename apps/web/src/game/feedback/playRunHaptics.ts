import {
    HAPTIC_STRENGTH,
    LANDING_HAPTIC_MINIMUM_VOLUME,
    LANDING_HAPTIC_HEAVY_VOLUME,
    type HapticStyle,
} from '../../configs/haptics';

import { HAPTICS } from '../../platform/Haptics';

import type { RunFeedbackEvent } from './RunFeedbackEvents';

export function playRunHaptics(events: ReadonlyArray<RunFeedbackEvent>): void {
    let strongest: HapticStyle | null = null;

    for (const event of events) {
        const style = impactStyle(event);

        if (style && (!strongest || HAPTIC_STRENGTH[style] > HAPTIC_STRENGTH[strongest])) {
            strongest = style;
        }
    }

    if (strongest) {
        HAPTICS.impact(strongest);
    }
}

function impactStyle(event: RunFeedbackEvent): HapticStyle | null {
    if (event.sound === 'explosion') {
        return 'heavy';
    }

    if (event.sound === 'metal') {
        return landingStyle(event.volume);
    }

    return event.isHeavy ? 'medium' : 'light';
}

function landingStyle(volume: number): HapticStyle | null {
    if (volume < LANDING_HAPTIC_MINIMUM_VOLUME) {
        return null;
    }

    return volume >= LANDING_HAPTIC_HEAVY_VOLUME ? 'heavy' : 'medium';
}
