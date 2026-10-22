import { type Upgrade, type RunReport, type Run, type StageId, type Progress } from '@zombie-drive/shared';

import type { API } from '../api/client';
import { prepareGarageArtwork } from '../artwork/prepareGarageArtwork';

import type { GarageState, ResultState, SetAppState } from './types';
import { pendingResult } from './pendingResult';
import { errorMessage } from './errorMessage';
import { GarageActions } from './GarageActions';
import { settleRun } from './settleRun';
import { discardRunResult } from './discardRunResult';

export class AppActions {
    private readonly garageActions: GarageActions;
    private isSettling = false;

    constructor(
        private readonly api: typeof API,
        private readonly setState: SetAppState,
        private readonly prepareGarage: typeof prepareGarageArtwork = prepareGarageArtwork,
    ) {
        this.garageActions = new GarageActions(api, setState, prepareGarage);
    }

    async load(isCurrent: () => boolean = (): boolean => true): Promise<void> {
        this.setState({ screen: 'loading' });

        try {
            await this.api.session();

            const progress = await this.api.progress();

            if (!isCurrent()) {
                return;
            }

            const pending = pendingResult.read();

            if (pending) {
                await this.finish(pending.run, pending.report);

                return;
            }

            await this.openGarage(progress, isCurrent);
        } catch (error: unknown) {
            if (isCurrent()) {
                this.setState({ screen: 'error', message: errorMessage(error) });
            }
        }
    }

    start(state: GarageState): Promise<void> {
        return this.garageActions.start(state);
    }

    buy(state: GarageState, upgrade: Upgrade): Promise<void> {
        return this.garageActions.buy(state, upgrade);
    }

    finish(run: Run, report: RunReport): Promise<void> {
        return this.withSettlement(() => settleRun({ api: this.api, setState: this.setState }, run, report));
    }

    discardResult(state: ResultState): Promise<void> {
        return this.withSettlement(() => discardRunResult({ api: this.api, setState: this.setState }, state));
    }

    garage(state: ResultState): Promise<void> {
        return this.garageActions.fromResult(state);
    }

    selectStage(state: GarageState, stageId: StageId): Promise<void> {
        return this.garageActions.selectStage(state, stageId);
    }

    abandonActive(state: GarageState): Promise<void> {
        return this.garageActions.abandonActive(state);
    }

    private async openGarage(progress: Progress, isCurrent: () => boolean): Promise<void> {
        await this.prepareGarage(progress);

        if (isCurrent()) {
            this.setState({ screen: 'garage', progress, isBusy: false, error: null });
        }
    }

    private async withSettlement(action: () => Promise<void>): Promise<void> {
        if (this.isSettling) {
            return;
        }

        this.isSettling = true;

        try {
            await action();
        } finally {
            this.isSettling = false;
        }
    }
}
