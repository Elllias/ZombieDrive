import type { StageId } from './schemas';
import type { StageConfig } from './stageTypes';
import { STAGES } from './configs/stages';

export function stageConfig(stageId: StageId = 'hills'): StageConfig {
    return STAGES[stageId];
}
