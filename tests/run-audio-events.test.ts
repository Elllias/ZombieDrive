import { expect, it } from 'vitest';

import { RunFeedbackEvents } from '../apps/web/src/game/feedback/RunFeedbackEvents';

import { truckScene } from './second-stage.helpers';
import { IDLE } from './physics.helpers';

it('emits one audible explosion and wood impact for a barrel hit by a crate', (): void => {
    const game = truckScene({
        barrelSpawns: [ { id: 'barrel', x: 14, row: 0 } ],
        crateSpawns: [ { id: 'crate', x: 12.5, row: 0 } ],
    });

    const sounds = new RunFeedbackEvents();
    const crate = game.crates.actors[0];

    crate?.part.body.setLinearVelocity({ x: 12, y: 0 });

    for (let step = 0; step < 30; step++) {
        game.step(IDLE);
    }

    const events = sounds.collect(game);

    expect(events.filter((event) => event.sound === 'explosion')).toHaveLength(1);
    expect(events.filter((event) => event.sound === 'wood')).toHaveLength(1);
    expect(sounds.collect(game)).toEqual([]);
});

it('gives a heavy zombie a stronger impact and never repeats an old kill', (): void => {
    const game = truckScene({ spawns: [ { id: 'heavy', x: 12, kind: 'heavy' } ] });
    const sounds = new RunFeedbackEvents();
    const zombie = game.zombies.actors[0];

    if (!zombie) {
        throw new Error('Expected zombie');
    }

    game.zombies.kill(zombie.body);
    game.zombies.afterStep();

    expect(sounds.collect(game)).toContainEqual({ sound: 'hit', volume: 0.8, rate: 0.75, isHeavy: true });
    expect(sounds.collect(game)).toEqual([]);
});

it('does not play remote impacts later when the player approaches', (): void => {
    const game = truckScene({ crateSpawns: [ { id: 'remote', x: 80, row: 0 } ] });
    const sounds = new RunFeedbackEvents();
    const crate = game.crates.actors[0];

    if (!crate) {
        throw new Error('Expected crate');
    }

    game.crates.breakBody(crate.part.body);
    game.crates.afterStep();
    expect(sounds.collect(game)).toEqual([]);
    game.car.chassis.setPosition({ x: 80, y: 5 });
    expect(sounds.collect(game)).toEqual([]);
});
