import { STAGE_IDS, stageConfig, type StageId } from '@zombie-drive/shared';

export function lockedStageLabel(stageId: StageId): string {
    const previous = STAGE_IDS[STAGE_IDS.indexOf(stageId) - 1];

    return previous ? `Пройди «${ stageConfig(previous).title }»` : 'Этап недоступен';
}
