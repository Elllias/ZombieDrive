import { INTRO_FIRST_SHOT, INTRO_SHOTS } from '../../configs/scenes/intro';
import type { IntroShot } from '../../configs/scenes/types';

export function introShot(elapsed: number): IntroShot {
    return [ ...INTRO_SHOTS ].reverse().find((shot) => elapsed >= shot.start) ?? INTRO_FIRST_SHOT;
}
