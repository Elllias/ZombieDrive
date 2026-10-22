import {
    GAME_CONFIG, carStats, rulesSnapshot, stageConfig, upgradeCost, upgradeMaxLevel, vehicleConfig,
    type StageId, type Upgrade, type Upgrades, type RunReport,
} from '@zombie-drive/shared';

import { runReward } from '../apps/api/src/domain/runReward';
import { GameSimulation } from '../apps/web/src/game/GameSimulation';
import type { Controls } from '../apps/web/src/game/physics/types';

import { slopeControls } from './level-controls.helpers';

export interface StageCampaign {
    stageId: StageId;
    balance: number;
    upgrades: Upgrades;
    seconds: number;
    attempts: number;
    reason: RunReport['reason'] | null;
}

export function playStageCampaign(
    stageId: StageId,
    balance: number,
    weights: Record<Upgrade, number>,
    controls: (game: GameSimulation) => Controls = slopeControls,
): StageCampaign {
    const state = createCampaign(stageId, balance);

    while (state.attempts < 40 && state.reason !== 'finish') {
        buyUpgrades(state, weights);

        const game = playAttempt(state.upgrades, stageId, controls);
        const report = game.report();

        state.attempts += 1;
        state.seconds += report.elapsedSeconds;
        state.reason = report.reason;
        state.balance += runReward(report, rulesSnapshot(stageId));
    }

    return state;
}

function createCampaign(stageId: StageId, balance: number): StageCampaign {
    return {
        stageId,
        balance,
        seconds: 0,
        attempts: 0,
        reason: null,
        upgrades: { engine: 0, tank: 0, tires: 0, suspension: 0, plow: 0 },
    };
}

function playAttempt(
    upgrades: Upgrades,
    stageId: StageId,
    controls: (game: GameSimulation) => Controls,
): GameSimulation {
    const game = new GameSimulation(carStats(upgrades, stageConfig(stageId).vehicleId), { stageId });

    while (!game.rules.reason && game.rules.elapsed < GAME_CONFIG.run.activeLimitSeconds) {
        game.step(controls(game));
    }

    return game;
}

function buyUpgrades(state: StageCampaign, weights: Record<Upgrade, number>): void {
    const available = vehicleConfig(stageConfig(state.stageId).vehicleId).upgrades
        .filter((upgrade) => (state.upgrades[upgrade] ?? 0) < upgradeMaxLevel(upgrade));

    available.sort((first, second) =>
        ((state.upgrades[first] ?? 0) + 1) * weights[first] - ((state.upgrades[second] ?? 0) + 1) * weights[second],
    );

    const next = available[0];

    if (!next) {
        return;
    }

    const cost = upgradeCost(next, state.upgrades[next] ?? 0, stageConfig(state.stageId).vehicleId);

    if (cost > state.balance) {
        return;
    }

    state.upgrades[next] = (state.upgrades[next] ?? 0) + 1;
    state.balance -= cost;
    buyUpgrades(state, weights);
}
