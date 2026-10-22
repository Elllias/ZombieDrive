import { expect, it } from 'vitest';

import { carStats } from '@zombie-drive/shared';

import { GameSimulation } from '../apps/web/src/game/GameSimulation';

import { slopeControls } from './level-controls.helpers';
import { MAXIMUM_R8 } from './third-stage.helpers';

it.each([ { stop: 940, exit: 1120 }, { stop: 1240, exit: 1370 } ])(
    'can leave the deep pit at $stop after braking on its floor', ({ stop, exit }): void => {
        const game = new GameSimulation(carStats(MAXIMUM_R8, 'r8'), {
            spawns: [], crateSpawns: [], barrelSpawns: [],
        });

        driveTo(game, stop);

        for (let step = 0; step < 240 && game.car.chassis.getLinearVelocity().length() > 0.3; step++) {
            game.step(slopeControls(game, false, true));
        }

        expect(game.car.chassis.getLinearVelocity().length()).toBeLessThan(1);
        driveTo(game, exit);
        expect(game.rules.reason).toBeNull();
        expect(game.car.chassis.getPosition().x).toBeGreaterThanOrEqual(exit);
    },
);

function driveTo(game: GameSimulation, x: number): void {
    while (!game.rules.reason && game.rules.elapsed < 240 && game.car.chassis.getPosition().x < x) {
        game.step(slopeControls(game));
    }
}
