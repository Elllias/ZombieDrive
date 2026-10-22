import type Phaser from 'phaser';

import { GAME_CONFIG, HAZARDS } from '@zombie-drive/shared';

import type { GameSimulation } from '../GameSimulation';

import { drawExplosions } from './drawExplosions';

export class BarrelVisuals {
    private images = new Map<string, Phaser.GameObjects.Image>();
    private effects: Phaser.GameObjects.Graphics;

    constructor(private scene: Phaser.Scene) {
        this.effects = scene.add.graphics().setDepth(8);
    }

    update(simulation: GameSimulation): void {
        const scale = GAME_CONFIG.rendering.pixelsPerMeter;

        simulation.barrels.actors.forEach((barrel): void => {
            const image = this.images.get(barrel.id);

            if (barrel.isExploded) {
                image?.destroy();
                this.images.delete(barrel.id);

                return;
            }

            const visual = image ?? this.scene.add.image(0, 0, 'barrel').setDepth(2)
                .setDisplaySize(HAZARDS.barrel.halfWidth * 2 * scale, HAZARDS.barrel.halfHeight * 2 * scale);

            const pose = simulation.poses.pose(barrel.part.body, simulation.alpha);

            visual.setVisible(barrel.part.body.isActive()).setPosition(pose.x * scale, pose.y * scale)
                .setRotation(pose.angle);

            this.images.set(barrel.id, visual);
        });

        drawExplosions(this.effects, simulation.barrels.explosions);
    }
}
