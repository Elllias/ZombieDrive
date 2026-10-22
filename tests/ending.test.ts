import { expect, it } from 'vitest';

import type { Progress } from '@zombie-drive/shared';

import {
    ENDING_STOP,
    ENDING_GATE_OPEN,
    ENDING_DEPARTURE,
    ENDING_ARRIVAL,
    ENDING_DURATION,
    ENDING_MOTION,
} from '../apps/web/src/configs/scenes/ending';

import { isEndingPreview } from '../apps/web/src/ui/ending/isEndingPreview';
import { isEscapeResult } from '../apps/web/src/ui/ending/isEscapeResult';
import { endingMotion } from '../apps/web/src/ui/ending/endingMotion';
import { endingShot } from '../apps/web/src/ui/ending/endingShot';

import { endingResult } from './ending.helpers';

it('opens the ending only after the final finish is saved by the server', (): void => {
    const state = endingResult();

    expect(isEscapeResult(state)).toBe(true);
    expect(isEscapeResult({ ...state, settlement: null, isBusy: true })).toBe(false);
    expect(isEscapeResult({ ...state, settlement: null, error: 'offline', isBusy: false })).toBe(false);
});

it.each([ 'hills', 'industrial' ] as const)('does not replace the result of %s with the ending', (stage): void => {
    expect(isEscapeResult(endingResult(stage))).toBe(false);
});

it.each([ 'fuel', 'rollover', 'stuck', 'timeout', 'abandon' ] as const)(
    'does not play a victory after %s even if the stage was previously completed', (reason): void => {
        const state = endingResult();

        expect(isEscapeResult({ ...state, report: { ...state.report, reason } })).toBe(false);
    },
);

it('does not treat an unlocked final stage as a completed story', (): void => {
    const state = endingResult();

    if (!state.settlement) {
        throw new Error('Missing test settlement');
    }

    const progress: Progress = { ...state.settlement.progress,
        stages: [ { stageId: 'pass', bestDistance: 0, completed: false } ] };

    expect(isEscapeResult({ ...state, settlement: { ...state.settlement, progress } })).toBe(false);
});

it.each([
    [ '', false ], [ '?scene=ending', true ], [ '?scene=ending&foo=bar', true ],
    [ '?scene=pass', false ], [ '?ending=1', false ],
])('selects the read-only preview for %s', (search, expected): void => {
    expect(isEndingPreview(search)).toBe(expected);
});

it('keeps the car still during the radio exchange and opens the barrier before departure', (): void => {
    expect(ENDING_GATE_OPEN + ENDING_MOTION.gateOpenDuration).toBeLessThanOrEqual(ENDING_DEPARTURE);
    expect(endingMotion(ENDING_STOP)['--car-x']).toBe(endingMotion(ENDING_DEPARTURE)['--car-x']);
    expect(endingMotion(ENDING_GATE_OPEN)['--gate-angle']).toBe('0deg');
    expect(endingMotion(ENDING_DEPARTURE)['--gate-angle']).toBe('85deg');
    expect(Number.parseFloat(endingMotion(ENDING_ARRIVAL)['--car-x'])).toBeGreaterThan(100);
    expect(endingMotion(ENDING_DURATION)['--gate-angle']).toBe('0deg');
});

it('follows the final story timing without skipping the radio or departure shots', (): void => {
    expect(endingShot(0).phase).toBe('approach');
    expect(endingShot(ENDING_STOP).phase).toBe('radio');
    expect(endingShot(ENDING_GATE_OPEN).phase).toBe('gate');
    expect(endingShot(ENDING_DEPARTURE).phase).toBe('departure');
    expect(endingShot(ENDING_ARRIVAL).phase).toBe('safe');
});
