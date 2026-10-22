import type Phaser from 'phaser';

import { stageConfig, type StageConfig } from '@zombie-drive/shared';

import type { ViewBounds } from '../physics/types';

import { drawFinish, drawTerrainChunk } from './drawTerrain';

const CHUNK_METERS = 16;

const WORLD_START = -12;

export class TerrainVisual {
    private chunks = new Map<number, Phaser.GameObjects.Image>();

    constructor(private scene: Phaser.Scene, private stage: StageConfig = stageConfig()) {
        drawFinish(scene.add.graphics().setDepth(-2), stage.track);
    }

    update(view: ViewBounds): void {
        const count = Math.ceil((this.stage.track.length + 30 - WORLD_START) / CHUNK_METERS);
        const first = Math.max(0, Math.floor((view.left - WORLD_START) / CHUNK_METERS) - 1);
        const last = Math.min(count - 1, Math.floor((view.right - WORLD_START) / CHUNK_METERS) + 1);

        for (let index = first; index <= last; index++) {
            if (!this.chunks.has(index)) {
                this.add(index);
            }
        }

        this.chunks.forEach((image, index): void => {
            if (index >= first && index <= last) {
                return;
            }

            image.destroy();
            this.scene.textures.remove(this.key(index));
            this.chunks.delete(index);
        });
    }

    private add(index: number): void {
        const start = WORLD_START + index * CHUNK_METERS;

        const image = drawTerrainChunk(this.scene, {
            start,
            end: start + CHUNK_METERS,
            key: this.key(index),
        }, this.stage);

        this.chunks.set(index, image);
    }

    private key(index: number): string {
        return `terrain-${ index }`;
    }
}
