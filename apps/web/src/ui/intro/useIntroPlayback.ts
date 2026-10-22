import { useCutscenePlayback } from '../cutscene/useCutscenePlayback';

import { INTRO_DURATION } from '../../configs/scenes/intro';

export function useIntroPlayback(onFinish: () => void): ReturnType<typeof useCutscenePlayback> {
    return useCutscenePlayback({ duration: INTRO_DURATION, onFinish });
}
