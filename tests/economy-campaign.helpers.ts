import { carStats, GAME_CONFIG, rulesSnapshot, upgradeCost, type Upgrade, type Upgrades, type RunReport } from '@zombie-drive/shared';

import { runReward } from '../apps/api/src/domain/runReward';
import { GameSimulation } from '../apps/web/src/game/GameSimulation';

import { slopeControls } from './level-controls.helpers';

interface CampaignResult {
    attempts: number;
    seconds: number;
    firstReward: number;
    firstUpgradeAttempt: number;
    reason: RunReport['reason'] | null;
}

interface CampaignState extends CampaignResult {
    balance: number;
    upgrades: Upgrades;
}

const UPGRADES: Array<Exclude<Upgrade, 'plow'>> = [ 'engine', 'tank', 'tires', 'suspension' ];

export function playEconomyCampaign(weights: Record<Exclude<Upgrade, 'plow'>, number>): CampaignResult {
    const state: CampaignState = {
        attempts: 0,
        seconds: 0,
        firstReward: 0,
        firstUpgradeAttempt: 0,
        reason: null,
        balance: 0,
        upgrades: { engine: 0, tank: 0, tires: 0, suspension: 0 },
    };

    while (state.attempts < 40 && state.reason !== 'finish') {
        completeAttempt(state, weights);
    }

    return state;
}

function completeAttempt(state: CampaignState, weights: Record<Exclude<Upgrade, 'plow'>, number>): void {
    const report = playAttempt(state.upgrades);
    const reward = runReward(report, rulesSnapshot());

    state.attempts += 1;
    state.seconds += report.elapsedSeconds;
    state.balance += reward;
    state.reason = report.reason;
    state.firstReward ||= reward;

    if (report.reason !== 'finish') {
        state.balance = buyUpgrades(state.upgrades, state.balance, weights);
    }

    if (!state.firstUpgradeAttempt && UPGRADES.some((upgrade) => state.upgrades[upgrade] > 0)) {
        state.firstUpgradeAttempt = state.attempts;
    }
}

function playAttempt(upgrades: Upgrades): RunReport {
    const game = new GameSimulation(carStats(upgrades));

    while (!game.rules.reason && game.rules.elapsed < GAME_CONFIG.run.activeLimitSeconds) {
        game.step(slopeControls(game));
    }

    return game.report();
}

function buyUpgrades(upgrades: Upgrades, balance: number, weights: Record<Exclude<Upgrade, 'plow'>, number>): number {
    const available = UPGRADES.filter((upgrade) => upgrades[upgrade] < GAME_CONFIG.economy.maxLevel);

    available.sort((first, second) =>
        (upgrades[first] + 1) * weights[first] - (upgrades[second] + 1) * weights[second],
    );

    const next = available[0];

    if (!next) {
        return balance;
    }

    const cost = upgradeCost(next, upgrades[next]);

    if (cost > balance) {
        return balance;
    }

    upgrades[next] += 1;

    return buyUpgrades(upgrades, balance - cost, weights);
}
