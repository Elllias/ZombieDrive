import { GAME_CONFIG } from '@zombie-drive/shared';

import type { Pose } from '../physics/types';

import { ART } from '../../configs/art';

type BodyPart = (typeof GAME_CONFIG.zombies.bodyParts)[number];

export function walkingPartPose(
    part: BodyPart,
    movement: {
        phase: number;
        isWalking: boolean;
        facesRight: boolean;
    },
): Pose {
    const reflection = movement.facesRight ? -1 : 1;
    const phase = movement.isWalking ? movement.phase : 0;
    const angle = partAngle(part.name, phase);
    const offsetX = part.x - part.jointX;
    const offsetY = part.y - part.jointY;
    const bob = movement.isWalking ? ART.zombieBobMeters * (1 - Math.cos(phase * 2)) : 0;

    return {
        x: reflection * (part.jointX + offsetX * Math.cos(angle) - offsetY * Math.sin(angle)),

        y:
            part.jointY
            + offsetX * Math.sin(angle)
            + offsetY * Math.cos(angle)
            + bob
            + ART.zombieGroundOffsetMeters,

        angle: angle * reflection,
    };
}

function partAngle(name: BodyPart['name'], phase: number): number {
    if (name === 'head' || name === 'torso') {
        return 0;
    }

    const swing = Math.sin(phase) * (name === 'leftArm' || name === 'leftLeg' ? 1 : -1);

    if (name === 'leftArm' || name === 'rightArm') {
        return (
            ART.zombieArmReach
            + (name === 'rightArm' ? ART.zombieFarArmReach : 0)
            + swing * ART.zombieArmSwing
        );
    }

    return swing * ART.zombieLegSwing;
}
