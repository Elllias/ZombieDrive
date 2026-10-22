import type { Run, RunReport, Settlement } from '@zombie-drive/shared';

import type { API } from '../api/client';
import { ApiError } from '../api/ApiError';
import { isConnectionError } from '../api/isConnectionError';

import type { ResultState, SetAppState } from './types';
import { pendingResult } from './pendingResult';
import { errorMessage } from './errorMessage';

const SETTLEMENT_RETRY_DELAY_MS = 1000;

interface SettlementContext {
    api: Pick<typeof API, 'finish'>;
    setState: SetAppState;
}

export async function settleRun(context: SettlementContext, run: Run, report: RunReport): Promise<void> {
    const isStored = pendingResult.write({ run, report });
    const state = pendingState(run, report);

    context.setState(state);

    try {
        const settlement = await finishWithRetry(context.api, run, report);

        pendingResult.clear();
        context.setState({ ...state, settlement, isBusy: false });
    } catch (error: unknown) {
        const storageWarning = isStored ? '' : ' Итог доступен до закрытия приложения.';

        const canDiscard = error instanceof ApiError && [ 401, 404, 422 ].includes(error.status);

        context.setState({ ...state, isBusy: false, canDiscard, error: errorMessage(error) + storageWarning });
    }
}

async function finishWithRetry(api: SettlementContext['api'], run: Run, report: RunReport): Promise<Settlement> {
    try {
        return await api.finish(run.id, report);
    } catch (error: unknown) {
        if (!isConnectionError(error)) {
            throw error;
        }

        await new Promise<void>((resolve) => setTimeout(resolve, SETTLEMENT_RETRY_DELAY_MS));

        return api.finish(run.id, report);
    }
}

function pendingState(run: Run, report: RunReport): ResultState {
    return {
        screen: 'result',
        run,
        report,
        settlement: null,
        isBusy: true,
        error: null,
        canDiscard: false,
    };
}
