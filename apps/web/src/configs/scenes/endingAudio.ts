import type { SoundOptions } from '../../audio/AudioMixer';

import type { EndingPhase } from './types';

type EndingMix = Required<Pick<SoundOptions, 'volume' | 'rate'>> & { radio: number };

export const ENDING_MIX: Record<EndingPhase, EndingMix> = {
    approach: { volume: 0.3, rate: 1.15, radio: 0 },
    radio: { volume: 0.12, rate: 0.8, radio: 0.16 },
    gate: { volume: 0.12, rate: 0.8, radio: 0.13 },
    departure: { volume: 0.32, rate: 1.4, radio: 0 },
    safe: { volume: 0, rate: 0.8, radio: 0 },
};
