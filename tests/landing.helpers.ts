import { Vec2 } from 'planck';

import { carStats, GAME_CONFIG } from '@zombie-drive/shared';

import { GameSimulation } from '../apps/web/src/game/GameSimulation';
import { groundedWheelCount } from '../apps/web/src/game/car/groundedWheelCount';

import { IDLE } from './physics.helpers';

interface LandingMetrics {
    hasLanded: boolean;
    airborneSeconds: number;
    verticalMotion: number;
    rotation: number;
}

export function landingMetrics(suspension: number): LandingMetrics {
    const game = new GameSimulation(carStats({ engine: 5, tank: 5, tires: 5, suspension }), {
        isFlat: true,
        spawns: [],
        crateSpawns: [],
    });

    const metrics: LandingMetrics = { hasLanded: false, airborneSeconds: 0, verticalMotion: 0, rotation: 0 };

    game.car.bodies.forEach((body): void => {
        body.setPosition(Vec2.add(body.getPosition(), Vec2(0, -2)));
    });

    for (let step = 0; step < 240; step += 1) {
        game.step(IDLE);
        observeLanding(metrics, game);
    }

    return metrics;
}

function observeLanding(metrics: LandingMetrics, game: GameSimulation): void {
    const isSupported = groundedWheelCount(game.car.wheels) > 0;

    metrics.hasLanded ||= isSupported;

    if (!metrics.hasLanded) {
        return;
    }

    const step = GAME_CONFIG.world.stepSeconds;

    metrics.airborneSeconds += isSupported ? 0 : step;
    metrics.verticalMotion += Math.abs(game.car.chassis.getLinearVelocity().y) * step;
    metrics.rotation += Math.abs(game.car.chassis.getAngularVelocity()) * step;
}
