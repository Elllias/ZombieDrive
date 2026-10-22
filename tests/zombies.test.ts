import { Vec2 } from 'planck';
import { expect, it } from 'vitest';

import { GAME_CONFIG } from '@zombie-drive/shared';

import { GameSimulation } from '../apps/web/src/game/GameSimulation';
import { walkingPartPose } from '../apps/web/src/game/rendering/walkingPartPose';
import { createRagdoll } from '../apps/web/src/game/zombies/createRagdoll';

import { BASE_STATS, IDLE, simulation } from './physics.helpers';

it.each([ 4, 24 ])('walks toward a car at x=%s instead of being held by ground friction', (carX): void => {
    const game = simulation([ { id: 'pursuer', x: 14 } ]);

    game.car.bodies.forEach((body): void => {
        const position = body.getPosition();

        body.setPosition(Vec2(position.x + carX - GAME_CONFIG.car.startX, position.y));
    });

    const zombie = game.zombies.actors[0];

    if (!zombie) {
        throw new Error('Missing test zombie');
    }

    game.zombies.beforeStep({ left: 0, right: 40, top: 0, bottom: 10 }, game.car.parts);

    for (let step = 0; step < 180; step += 1) {
        game.step(IDLE);
    }

    expect(zombie.state).toBe('walking');
    expect(Math.abs(zombie.body.getPosition().x - carX)).toBeLessThan(Math.abs(14 - carX) - 2);
});

it('waits without horizontal movement until it enters view', (): void => {
    const game = simulation([ { id: 'waiting', x: 25 } ]);

    for (let step = 0; step < 180; step += 1) {
        game.step(IDLE);
    }

    expect(game.zombies.actors[0]?.state).toBe('waiting');
    expect(game.zombies.actors[0]?.body.getPosition().x).toBeCloseTo(25, 6);
});

it('climbs toward the player on the actual uneven track', (): void => {
    const game = new GameSimulation(BASE_STATS, { spawns: [ { id: 'hill', x: 29 } ] });
    const zombie = game.zombies.actors[0];

    if (!zombie) {
        throw new Error('Missing test zombie');
    }

    game.zombies.beforeStep({ left: 0, right: 40, top: 0, bottom: 10 }, game.car.parts);

    for (let step = 0; step < 240; step += 1) {
        game.step(IDLE);
    }

    expect(zombie.state).toBe('walking');
    expect(zombie.body.getPosition().x).toBeLessThan(27);
});

it.each([ false, true ])(
    'keeps the live body connected throughout a walking cycle, facesRight=%s',
    (facesRight): void => {
        const torso = GAME_CONFIG.zombies.bodyParts[0];
        const head = GAME_CONFIG.zombies.bodyParts[1];

        for (let sample = 0; sample < 16; sample += 1) {
            const movement = { phase: (sample * Math.PI) / 8, isWalking: true, facesRight };
            const torsoPose = walkingPartPose(torso, movement);
            const headPose = walkingPartPose(head, movement);

            expect(headPose.y + head.halfHeight).toBeGreaterThan(torsoPose.y - torso.halfHeight);

            GAME_CONFIG.zombies.bodyParts.slice(2).forEach((part): void => {
                const pose = walkingPartPose(part, movement);
                const anchorX = pose.x - Math.sin(pose.angle) * (part.jointY - part.y);
                const anchorY = pose.y + Math.cos(pose.angle) * (part.jointY - part.y);

                expect(anchorX - torsoPose.x).toBeCloseTo((part.jointX - torso.x) * (facesRight ? -1 : 1), 6);
                expect(anchorY - torsoPose.y).toBeCloseTo(part.jointY - torso.y, 6);
            });
        }
    },
);

it('attaches ragdoll limbs at the same neck, shoulders and hips as the live body', (): void => {
    const game = simulation([ { id: 'ragdoll', x: 14 } ]);
    const zombie = game.zombies.actors[0];

    if (!zombie) {
        throw new Error('Missing test zombie');
    }

    const origin = zombie.body.getPosition().clone();

    createRagdoll(game.world, zombie);

    let count = 0;

    for (let joint = game.world.getJointList(); joint; joint = joint.getNext()) {
        const index = zombie.parts.findIndex((part) => part.body === joint.getBodyB());
        const settings = GAME_CONFIG.zombies.bodyParts[index];

        if (!settings || index < 1) {
            continue;
        }

        expect(joint.getAnchorA().x).toBeCloseTo(origin.x + settings.jointX, 6);
        expect(joint.getAnchorA().y).toBeCloseTo(origin.y + settings.jointY, 6);
        expect(joint.getAnchorB()).toEqual(joint.getAnchorA());
        count += 1;
    }

    expect(count).toBe(5);
});

it.each([ false, true ])(
    'reaches forward with both hands and alternates the feet, facesRight=%s',
    (facesRight): void => {
        const direction = facesRight ? 1 : -1;

        for (let sample = 0; sample < 16; sample += 1) {
            const movement = { phase: (sample * Math.PI) / 8, isWalking: true, facesRight };

            GAME_CONFIG.zombies.bodyParts.slice(2, 4).forEach((part): void => {
                const pose = walkingPartPose(part, movement);
                const handX = pose.x - Math.sin(pose.angle) * part.halfHeight;

                expect(handX * direction).toBeGreaterThan(0.4);
            });
        }

        const nearLeg = GAME_CONFIG.zombies.bodyParts[4];
        const farLeg = GAME_CONFIG.zombies.bodyParts[5];
        const first = { phase: Math.PI / 2, isWalking: true, facesRight };
        const second = { ...first, phase: Math.PI * 1.5 };
        const firstSeparation = walkingPartPose(nearLeg, first).x - walkingPartPose(farLeg, first).x;
        const secondSeparation = walkingPartPose(nearLeg, second).x - walkingPartPose(farLeg, second).x;

        expect(firstSeparation * secondSeparation).toBeLessThan(0);
    },
);
