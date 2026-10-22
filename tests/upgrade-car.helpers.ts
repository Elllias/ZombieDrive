import { Vec2 } from 'planck';

import { carStats, GAME_CONFIG, terrainHeight } from '@zombie-drive/shared';

import { GameSimulation } from '../apps/web/src/game/GameSimulation';

interface SectionCarOptions {
    tires: number;
    suspension: number;
    start: number;
    speed: number;
}

export function sectionCar(options: SectionCarOptions): GameSimulation {
    const { tires, suspension, start, speed } = options;
    const stats = carStats({ engine: 5, tank: 5, tires, suspension });
    const game = new GameSimulation(stats, { spawns: [], crateSpawns: [] });
    const offset = Vec2(start - GAME_CONFIG.car.startX, terrainHeight(start) - terrainHeight(GAME_CONFIG.car.startX));

    game.car.bodies.forEach((body): void => {
        body.setPosition(Vec2.add(body.getPosition(), offset));
    });

    // Settle identical starting conditions before the timed drive; the motor initially holds the car still.
    for (let step = 0; step < 240; step += 1) {
        const settings = GAME_CONFIG.world;

        game.world.step(settings.stepSeconds, settings.velocityIterations, settings.positionIterations);
    }

    game.car.bodies.forEach((body): void => {
        body.setLinearVelocity(Vec2(speed, 0));
    });

    game.car.wheels.forEach((wheel): void => {
        wheel.setAngularVelocity(speed / stats.wheelRadius);
    });

    return game;
}
