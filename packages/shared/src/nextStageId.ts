import { STAGE_IDS } from './identifiers';
import type { StageId } from './schemas';

export function nextStageId(stageId: StageId = 'hills'): StageId | null {
    return STAGE_IDS[STAGE_IDS.indexOf(stageId) + 1] ?? null;
}
