import type { StageId } from '../../schemas';
import type { StageConfig } from '../../stageTypes';
import { HILLS_STAGE } from './hills';
import { INDUSTRIAL_STAGE } from './industrial';
import { PASS_STAGE } from './pass';

export const STAGES: Record<StageId, StageConfig> = {
    hills: HILLS_STAGE,
    industrial: INDUSTRIAL_STAGE,
    pass: PASS_STAGE,
};

