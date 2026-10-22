import type Phaser from 'phaser';

import { GAME_CONFIG } from '@zombie-drive/shared';

import type { GameSimulation } from '../GameSimulation';
import type { PhysicalPart } from '../physics/types';

export class CrateVisuals {
    private images = new Map<string, Phaser.GameObjects.Image>();

    constructor(private scene: Phaser.Scene) {
        const texture = scene.textures.get('crate');

        for (let frame = 0; frame < 4; frame++) {
            texture.add(frame, 0, (frame % 2) * 256, Math.floor(frame / 2) * 256, 256, 256);
        }
    }

    update(simulation: GameSimulation): void {
        const visible = new Set<string>();

        simulation.crates.actors
            .filter((crate) => !crate.isBroken && crate.part.body.isActive())
            .forEach((crate): void => {
                visible.add(crate.id);
                this.place(crate.id, { part: crate.part, frame: '__BASE', simulation });
            });

        simulation.crates.fragments.forEach((fragment): void => {
            visible.add(fragment.id);
            this.place(fragment.id, { part: fragment.part, frame: fragment.frame, simulation });
            this.images.get(fragment.id)?.setAlpha(Math.min(1, fragment.remainingSeconds));
        });

        this.images.forEach((image, id): void => {
            if (visible.has(id)) {
                return;
            }

            image.destroy();
            this.images.delete(id);
        });
    }

    private place(
        id: string,
        options: { part: PhysicalPart; frame: number | string; simulation: GameSimulation },
    ): void {
        const { part, simulation } = options;

        if (part.shape.kind !== 'box') {
            return;
        }

        const scale = GAME_CONFIG.rendering.pixelsPerMeter;

        const image = this.images.get(id)
            ?? this.scene.add
                .image(0, 0, 'crate', options.frame)
                .setDepth(2.5)
                .setDisplaySize(part.shape.halfWidth * 2 * scale, part.shape.halfHeight * 2 * scale);

        this.images.set(id, image);

        const pose = simulation.poses.pose(part.body, simulation.alpha);

        image.setPosition(pose.x * scale, pose.y * scale).setRotation(pose.angle);
    }
}
