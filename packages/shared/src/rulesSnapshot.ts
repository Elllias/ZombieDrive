import { GAME_CONFIG } from './configs/game';
import { stageConfig } from './stageConfig';
import { vehicleConfig } from './vehicleConfig';
import { HAZARDS } from './configs/hazards';
import type { RunRulesSnapshot, StageId } from './schemas';

export function rulesSnapshot(stageId: StageId = 'hills'): RunRulesSnapshot {
    const stage = stageConfig(stageId);
    const car = vehicleConfig(stage.vehicleId).settings;

    return {
        distanceRate: GAME_CONFIG.economy.rewards[stageId].distanceRate,
        killRate: GAME_CONFIG.economy.rewards[stageId].killRate,
        maximumDistance: stage.track.length,
        maximumSpeed: car.motorSpeed * (car.wheelRadius + GAME_CONFIG.economy.maxLevel * car.wheelRadiusPerLevel) * 2,
        activeLimitSeconds: GAME_CONFIG.run.activeLimitSeconds,
        startX: car.startX,
        zombieSpeed: GAME_CONFIG.zombies.speed,
        activationMargin: GAME_CONFIG.zombies.activeAhead + HAZARDS.barrel.blastRadius,

        spawns: stage.zombies.map((spawn) => ({
            id: spawn.id,
            x: spawn.x,
            rewardMultiplier: spawn.kind === 'heavy' ? HAZARDS.heavyZombie.rewardMultiplier : 1,
        })),
    };
}
