import { STAGE_IDS, type Settlement } from '@zombie-drive/shared';

import type { AppState, ResultState } from '../../state/types';

export function isEscapeResult(state: AppState): state is ResultState & { settlement: Settlement } {
    return state.screen === 'result'
        && !state.isBusy
        && state.report.reason === 'finish'
        && state.run.stageId === STAGE_IDS.at(-1)
        && state.settlement !== null
        && state.settlement.progress.stages?.some((stage) =>
            stage.stageId === state.run.stageId && stage.completed,
        ) === true;
}
