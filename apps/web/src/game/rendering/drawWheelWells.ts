import type Phaser from 'phaser';

import { GAME_CONFIG, vehicleConfig, type VehicleId } from '@zombie-drive/shared';

export function drawWheelWells(scene: Phaser.Scene, vehicleId: VehicleId = 'suv'): Phaser.GameObjects.Graphics {
    const vehicle = vehicleConfig(vehicleId);
    const settings = GAME_CONFIG.rendering;
    const graphics = scene.add.graphics().setDepth(2);

    graphics.fillStyle(settings.wheelWellColor);

    vehicle.wheelWells.forEach((outline): void => {
        const points = outline.map((point) => ({
            x: (point.x - 0.5) * vehicle.width * settings.pixelsPerMeter,
            y: (point.y - vehicle.originY) * vehicle.height * settings.pixelsPerMeter,
        }));

        graphics.fillPoints(points, true);
    });

    return graphics;
}
