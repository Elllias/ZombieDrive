import { GAME_CONFIG } from '@zombie-drive/shared';

import type { GameSimulation } from '../apps/web/src/game/GameSimulation';
import type { Controls } from '../apps/web/src/game/physics/types';

interface SectionMetrics {
    rotation: number;
    wheelTravel: number;
    bodyTravel: number;
}

export function driveSection(game: GameSimulation, end: number, controls: (game: GameSimulation) => Controls): {
    elapsed: number;
    speed: number;
    rotation: number;
    slipRatio: number;
} {
    const metrics: SectionMetrics = { rotation: 0, wheelTravel: 0, bodyTravel: 0 };

    while (game.rules.elapsed < 30 && !game.rules.reason && game.car.chassis.getPosition().x < end) {
        game.step(controls(game));
        observe(metrics, game);
    }

    return {
        elapsed: game.rules.elapsed,
        speed: game.car.chassis.getLinearVelocity().x,
        rotation: metrics.rotation,
        slipRatio: metrics.wheelTravel / Math.max(0.001, metrics.bodyTravel),
    };
}

function observe(metrics: SectionMetrics, game: GameSimulation): void {
    const step = GAME_CONFIG.world.stepSeconds;
    const wheelSpeed = game.car.wheels.reduce((sum, wheel) => sum + Math.abs(wheel.getAngularVelocity()), 0) / 2;

    metrics.rotation += Math.abs(game.car.chassis.getAngularVelocity()) * step;
    metrics.wheelTravel += wheelSpeed * game.car.stats.wheelRadius * step;
    metrics.bodyTravel += Math.abs(game.car.chassis.getLinearVelocity().x) * step;
}
