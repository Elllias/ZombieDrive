import type Phaser from 'phaser';

export function drawBackdrop(scene: Phaser.Scene): Phaser.GameObjects.Image {
    return scene.add.image(0, 0, 'landscape').setOrigin(0).setScrollFactor(0).setDepth(-5);
}
