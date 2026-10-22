import type Phaser from 'phaser';

import { GAME_CONFIG, HAZARDS } from '@zombie-drive/shared';

import type { Explosion } from '../barrels/types';

export function drawExplosions(graphics: Phaser.GameObjects.Graphics, effects: ReadonlyArray<Explosion>): void {
    const scale = GAME_CONFIG.rendering.pixelsPerMeter;

    graphics.clear();

    effects.forEach((effect): void => {
        const progress = effect.age / HAZARDS.barrel.effectSeconds;
        const x = effect.x * scale;
        const y = effect.y * scale;
        const radius = (0.45 + Math.sin(Math.min(1, progress * 2) * Math.PI / 2) * 1.6) * scale;

        graphics.fillStyle(0x382d23, (1 - progress) * 0.65)
            .fillCircle(x, y - progress * scale * 2, radius * 1.2);

        drawFire(graphics, { x, y, radius, progress });
    });
}

function drawFire(
    graphics: Phaser.GameObjects.Graphics,
    point: { x: number; y: number; radius: number; progress: number },
): void {
    const alpha = Math.max(0, 1 - point.progress * 2);

    for (let index = 0; index < 7; index++) {
        const angle = index * Math.PI * 2 / 7;
        const distance = point.radius * 0.55;

        graphics.fillStyle(0xe85b1e, alpha).fillCircle(
            point.x + Math.cos(angle) * distance, point.y + Math.sin(angle) * distance,
            point.radius * (0.3 + index % 2 * 0.15),
        );
    }

    graphics.fillStyle(0xffd57b, alpha).fillCircle(point.x, point.y, point.radius * 0.55);
}
