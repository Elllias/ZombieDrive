import type Phaser from 'phaser';

import { GAME_CONFIG } from '@zombie-drive/shared';

import type { GameSimulation } from '../GameSimulation';
import type { Zombie } from '../zombies/types';
import type { Pose } from '../physics/types';

import { ART, ZOMBIE_FRAMES } from '../../configs/art';
import { walkingPartPose } from './walkingPartPose';

interface ActorVisual {
    images: Array<Phaser.GameObjects.Image>;
    previousX: number;
    distance: number;
}

interface WalkingVisual {
    pose: Pose;
    phase: number;
    isWalking: boolean;
    facesRight: boolean;
    scale: number;
}

export class ZombieVisuals {
    private actors = new Map<string, ActorVisual>();

    constructor(private scene: Phaser.Scene) {
        const texture = scene.textures.get('zombie');

        ZOMBIE_FRAMES.forEach((frame, index): void => {
            texture.add(index, 0, frame.x, frame.y, frame.width, frame.height);
        });
    }

    update(simulation: GameSimulation): void {
        simulation.zombies.actors.forEach((zombie): void => {
            const actor = this.actors.get(zombie.id) ?? this.create(zombie);
            const walking = this.movement(actor, zombie, simulation);

            actor.images.forEach((image, index): void => {
                image.setVisible(zombie.body.isActive());

                if (zombie.state === 'ragdoll') {
                    this.placeRagdoll(image, { zombie, index, simulation });
                } else {
                    this.placeWalking(image, index, walking);
                }
            });
        });
    }

    private create(zombie: Zombie): ActorVisual {
        const scale = GAME_CONFIG.rendering.pixelsPerMeter;

        const images = GAME_CONFIG.zombies.bodyParts.map((part, index) => {
            const frame = ZOMBIE_FRAMES[index];

            if (!frame) {
                throw new Error('Missing zombie body part frame');
            }

            return this.scene.add
                .image(0, 0, 'zombie', index)
                .setDepth(frame.depth)
                .setTint(zombie.kind === 'heavy' ? 0xa5b47c : frame.tint)
                .setDisplaySize(part.halfWidth * 2 * scale * zombie.scale, part.halfHeight * 2 * scale * zombie.scale);
        });

        const actor = { images, previousX: zombie.body.getPosition().x, distance: 0 };

        this.actors.set(zombie.id, actor);

        return actor;
    }

    private movement(actor: ActorVisual, zombie: Zombie, simulation: GameSimulation): WalkingVisual {
        const pose = simulation.poses.pose(zombie.body, simulation.alpha);

        const isWalking = zombie.state === 'walking'
            && Math.abs(zombie.body.getLinearVelocity().x) > ART.zombieWalkingThreshold;

        if (isWalking) {
            actor.distance += Math.abs(pose.x - actor.previousX);
        }

        actor.previousX = pose.x;

        return {
            pose,
            scale: zombie.scale,
            isWalking,
            phase: (actor.distance / (ART.zombieStrideMeters * zombie.scale)) * Math.PI * 2,
            facesRight: simulation.car.chassis.getPosition().x > pose.x,
        };
    }

    private placeRagdoll(
        image: Phaser.GameObjects.Image,
        options: {
            zombie: Zombie;
            index: number;
            simulation: GameSimulation;
        },
    ): void {
        const part = options.zombie.parts[options.index];

        if (!part) {
            return;
        }

        const pose = options.simulation.poses.pose(part.body, options.simulation.alpha);
        const scale = GAME_CONFIG.rendering.pixelsPerMeter;

        image.setPosition(pose.x * scale, pose.y * scale).setRotation(pose.angle);
    }

    private placeWalking(image: Phaser.GameObjects.Image, index: number, walking: WalkingVisual): void {
        const part = GAME_CONFIG.zombies.bodyParts[index];
        const frame = ZOMBIE_FRAMES[index];

        if (!part || !frame) {
            return;
        }

        const offset = walkingPartPose(part, walking);
        const scale = GAME_CONFIG.rendering.pixelsPerMeter;

        image
            .setPosition(
                (walking.pose.x + offset.x * walking.scale) * scale,
                (walking.pose.y + offset.y * walking.scale) * scale,
            )
            .setRotation(offset.angle)
            .setFlipX(walking.facesRight !== frame.flipX);
    }
}
