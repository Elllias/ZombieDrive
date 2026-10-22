import type { API } from '../api/client';
import { ApiError } from '../api/ApiError';

import type { ResultState, SetAppState } from './types';
import { pendingResult } from './pendingResult';
import { errorMessage } from './errorMessage';

interface DiscardContext {
    api: Pick<typeof API, 'session' | 'finish' | 'progress'>;
    setState: SetAppState;
}

export async function discardRunResult(context: DiscardContext, state: ResultState): Promise<void> {
    if (!state.canDiscard || state.isBusy) {
        return;
    }

    context.setState({ ...state, isBusy: true, error: null });

    try {
        await context.api.session();
        await abandonRun(context.api, state.run.id);

        const progress = await context.api.progress();

        pendingResult.clear();
        context.setState({ screen: 'garage', progress, isBusy: false, error: null });
    } catch (error: unknown) {
        context.setState({ ...state, isBusy: false, error: errorMessage(error) });
    }
}

async function abandonRun(api: DiscardContext['api'], id: string): Promise<void> {
    try {
        await api.finish(id, { distance: 0, elapsedSeconds: 0, killedZombieIds: [], reason: 'abandon' });
    } catch (error: unknown) {
        if (!(error instanceof ApiError) || error.status !== 404) {
            throw error;
        }
    }
}
