import Phaser from 'phaser';

import { GAME_CONFIG } from '@zombie-drive/shared';

import type { GameSimulation } from '../GameSimulation';

import { drawBackdrop } from './drawBackdrop';
import { drawScenery } from './drawScenery';
import { TerrainVisual } from './TerrainVisual';
import { CarVisual } from './CarVisual';
import { ZombieVisuals } from './ZombieVisuals';
import { CrateVisuals } from './CrateVisuals';
import { BarrelVisuals } from './BarrelVisuals';
import { ART } from '../../configs/art';
import { runViewport } from './runViewport';

export class RunVisuals {
    private readonly terrain: TerrainVisual;
    private readonly car: CarVisual;
    private readonly zombies: ZombieVisuals;
    private readonly crates: CrateVisuals;
    private readonly barrels: BarrelVisuals;
    private readonly backdrop: Phaser.GameObjects.Image;

    constructor(private readonly scene: Phaser.Scene, private readonly simulation: GameSimulation) {
        this.backdrop = drawBackdrop(scene);
        drawScenery(scene, simulation.stage.track);
        this.terrain = new TerrainVisual(scene, simulation.stage);
        this.car = new CarVisual(scene, simulation.car.stats);
        this.zombies = new ZombieVisuals(scene);
        this.crates = new CrateVisuals(scene);
        this.barrels = new BarrelVisuals(scene);
        scene.scale.on(Phaser.Scale.Events.RESIZE, this.resize);

        scene.events.once(Phaser.Scenes.Events.SHUTDOWN, (): void => {
            scene.scale.off(Phaser.Scale.Events.RESIZE, this.resize);
        });

        this.resize();
    }

    update(simulation: GameSimulation): void {
        this.updateCamera(simulation);
        this.terrain.update(simulation.view);
        this.car.update(simulation);
        this.zombies.update(simulation);
        this.crates.update(simulation);
        this.barrels.update(simulation);
    }

    private readonly resize = (): void => {
        const viewport = runViewport(this.scene.scale.gameSize);
        const cover = Math.max(viewport.width / this.backdrop.width, viewport.height / this.backdrop.height);
        const scale = cover * (1 + ART.backdropOverscan);

        this.simulation.setViewWidth(viewport.width);
        this.scene.cameras.main.setOrigin(0).setZoom(viewport.zoom);
        this.backdrop.setScale(scale);
        this.backdrop.y = -(this.backdrop.displayHeight - viewport.height) * 0.3;
        this.update(this.simulation);
    };

    private updateCamera(simulation: GameSimulation): void {
        const current = simulation.car.chassis.getPosition();
        const pose = simulation.poses.pose(simulation.car.chassis, simulation.alpha);
        const scale = GAME_CONFIG.rendering.pixelsPerMeter;
        const left = (simulation.view.left + pose.x - current.x) * scale;
        const top = (simulation.view.top + pose.y - current.y) * scale;
        const progress = Math.max(0, Math.min(1, left / (simulation.stage.track.length * scale)));

        this.scene.cameras.main.setScroll(left, top);
        this.backdrop.x = -progress * (this.backdrop.displayWidth - this.scene.cameras.main.displayWidth);
    }
}
