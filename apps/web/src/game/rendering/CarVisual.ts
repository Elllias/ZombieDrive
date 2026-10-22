import type Phaser from 'phaser';
import { Vec2 } from 'planck';

import { GAME_CONFIG, plowAppearance, vehicleConfig, type CarStats } from '@zombie-drive/shared';

import type { GameSimulation } from '../GameSimulation';

import { drawWheelWells } from './drawWheelWells';

export class CarVisual {
    private readonly chassis: Phaser.GameObjects.Image;
    private readonly wheelWells: Phaser.GameObjects.Graphics;
    private readonly wheels: Array<Phaser.GameObjects.Image>;
    private readonly plow: Phaser.GameObjects.Image | null;

    constructor(scene: Phaser.Scene, private readonly stats: CarStats) {
        const scale = GAME_CONFIG.rendering.pixelsPerMeter;
        const vehicle = vehicleConfig(stats.vehicleId);
        const plow = plowAppearance(stats.vehicleId);

        this.wheelWells = drawWheelWells(scene, stats.vehicleId);

        this.chassis = scene.add.image(0, 0, 'car').setOrigin(0.5, vehicle.originY).setDepth(4)
            .setDisplaySize(vehicle.width * scale, vehicle.height * scale);

        this.wheels = vehicle.axles.map((_offset, index) => scene.add.image(0, 0, `wheel-${ stats.tireLevel }`)
            .setDepth(vehicle.foregroundAxles?.includes(index) ? 5 : 3));

        this.plow = stats.plowLevel
            ? scene.add.image(0, 0, 'plow').setDepth(6)
                .setDisplaySize(plow.width * scale, plow.height * scale)
            : null;
    }

    update(simulation: GameSimulation): void {
        const scale = GAME_CONFIG.rendering.pixelsPerMeter;
        const pose = simulation.poses.pose(simulation.car.chassis, simulation.alpha);

        this.chassis.setPosition(pose.x * scale, pose.y * scale).setRotation(pose.angle);
        this.wheelWells.setPosition(pose.x * scale, pose.y * scale).setRotation(pose.angle);

        if (this.plow) {
            const position = plowAppearance(this.stats.vehicleId);
            const offset = Vec2(position.x, position.y);
            const x = pose.x + offset.x * Math.cos(pose.angle) - offset.y * Math.sin(pose.angle);
            const y = pose.y + offset.x * Math.sin(pose.angle) + offset.y * Math.cos(pose.angle);

            this.plow.setPosition(x * scale, y * scale).setRotation(pose.angle);
        }

        this.updateWheels(simulation);
    }

    private updateWheels(simulation: GameSimulation): void {
        const scale = GAME_CONFIG.rendering.pixelsPerMeter;

        simulation.car.wheels.forEach((body, index): void => {
            const current = simulation.poses.pose(body, simulation.alpha);

            this.wheels[index]?.setTexture(`wheel-${ simulation.car.stats.tireLevel }`)
                .setDisplaySize(
                    simulation.car.stats.wheelRadius * 2 * scale, simulation.car.stats.wheelRadius * 2 * scale,
                )
                .setPosition(current.x * scale, current.y * scale).setRotation(current.angle);
        });
    }
}
