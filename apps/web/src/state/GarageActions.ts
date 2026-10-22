import { GAME_CONFIG, nextStageId, type Upgrade, type StageId, type Run, type Progress } from '@zombie-drive/shared';

import type { API } from '../api/client';
import { ApiError } from '../api/ApiError';
import { prepareGarageArtwork } from '../artwork/prepareGarageArtwork';

import type { GarageState, ResultState, SetAppState } from './types';
import { errorMessage } from './errorMessage';

export class GarageActions {
    private startKey: string | null = null;
    private readonly purchaseKeys = new Map<string, string>();
    private isPending = false;

    constructor(
        private readonly api: Pick<typeof API, 'start' | 'purchase' | 'selectStage' | 'finish'>,
        private readonly setState: SetAppState,
        private readonly prepareGarage: typeof prepareGarageArtwork = prepareGarageArtwork,
    ) {}

    start(state: GarageState): Promise<void> {
        return this.execute(state, (): Promise<Run> => this.requestStart(), (run): void => {
            this.startKey = null;
            this.setState({ screen: 'run', progress: state.progress, run });
        });
    }

    async buy(state: GarageState, upgrade: Upgrade): Promise<void> {
        if (state.isBusy || this.isPending) {
            return;
        }

        const expectedLevel = state.progress.upgrades[upgrade] ?? 0;
        const stageId = state.progress.stageId ?? 'hills';
        const actionId = `${ stageId }:${ upgrade }:${ expectedLevel }`;
        const key = this.purchaseKeys.get(actionId) ?? crypto.randomUUID();

        this.purchaseKeys.set(actionId, key);

        await this.execute(
            state,
            () => this.api.purchase({ key, upgrade, expectedLevel, stageId }),
            (progress): Promise<void> => this.openGarage(progress, (): void => {
                this.purchaseKeys.delete(actionId);
            }),
        );
    }

    async selectStage(state: GarageState, stageId: StageId): Promise<void> {
        if (state.progress.activeRun) {
            return;
        }

        await this.execute(state, () => this.api.selectStage(stageId),
            (progress): Promise<void> => this.openGarage(progress, (): void => {
                this.startKey = null;
            }));
    }

    async fromResult(state: ResultState): Promise<void> {
        if (!state.settlement || state.isBusy || this.isPending) {
            return;
        }

        const { progress } = state.settlement;
        const next = state.report.reason === 'finish' ? nextStageId(state.run.stageId) : null;
        const isUnlocked = progress.stages?.some((stage) => stage.stageId === next);

        await this.execute(state,
            () => next && isUnlocked ? this.api.selectStage(next) : Promise.resolve(progress),
            (selected): Promise<void> => this.openGarage(selected, (): void => {
                if (next && isUnlocked) {
                    this.startKey = null;
                }
            }));
    }

    async abandonActive(state: GarageState): Promise<void> {
        const run = state.progress.activeRun;

        if (!run) {
            return;
        }

        await this.execute(state, () => this.api.finish(run.id, {
            distance: 0,
            elapsedSeconds: 0,
            killedZombieIds: [],
            reason: 'abandon',
        }), (settlement): Promise<void> => this.openGarage(settlement.progress, (): void => {
            this.startKey = null;
        }));
    }

    private async openGarage(progress: Progress, complete?: () => void): Promise<void> {
        await this.prepareGarage(progress);
        complete?.();
        this.setState({ screen: 'garage', progress, isBusy: false, error: null });
    }

    private async requestStart(): Promise<Run> {
        this.startKey ??= crypto.randomUUID();

        const run = await this.startAttempt(this.startKey);

        if (run.configurationVersion !== GAME_CONFIG.version) {
            throw new Error('Обновите приложение для новой версии игры.');
        }

        return run;
    }

    private async startAttempt(key: string): Promise<Run> {
        try {
            return await this.api.start(key);
        } catch (error: unknown) {
            if (!(error instanceof ApiError) || error.status !== 410) {
                throw error;
            }

            this.startKey = crypto.randomUUID();

            return this.api.start(this.startKey);
        }
    }

    private async execute<Value>(
        state: GarageState | ResultState,
        request: () => Promise<Value>,
        commit: (value: Value) => void | Promise<void>,
    ): Promise<void> {
        if (state.isBusy || this.isPending) {
            return;
        }

        this.isPending = true;
        this.setState({ ...state, isBusy: true, error: null });

        try {
            const value = await request();

            await commit(value);
        } catch (error: unknown) {
            this.setState({ ...state, isBusy: false, error: errorMessage(error) });
        } finally {
            this.isPending = false;
        }
    }
}
