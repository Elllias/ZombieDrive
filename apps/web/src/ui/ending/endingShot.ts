import { ENDING_FIRST_SHOT, ENDING_SHOTS } from '../../configs/scenes/ending';
import type { EndingShot } from '../../configs/scenes/types';

export function endingShot(elapsed: number): EndingShot {
    return [ ...ENDING_SHOTS ].reverse().find((shot) => elapsed >= shot.start) ?? ENDING_FIRST_SHOT;
}
