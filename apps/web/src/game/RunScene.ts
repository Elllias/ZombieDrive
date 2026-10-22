import Phaser from 'phaser';
import { Vec2 } from 'planck';

import { GAME_CONFIG, terrainHeight, vehicleConfig } from '@zombie-drive/shared';

import type { GameSimulation } from './GameSimulation';
import { GameBridge } from './GameBridge';
import { RunVisuals } from './rendering/RunVisuals';
import { loadRunArt } from './rendering/loadRunArt';
import { HAPTICS } from '../platform/Haptics';

import { RunAudio } from './audio/RunAudio';
import { RunFeedbackEvents } from './feedback/RunFeedbackEvents';
import { playRunHaptics } from './feedback/playRunHaptics';

export class RunScene extends Phaser.Scene {
    private readonly feedback = new RunFeedbackEvents();
    private visuals: RunVisuals | null = null;
    private lastPublish = 0;
    private audio: RunAudio | null = null;
    private wasPaused = false;
    private hasLoadError = false;
    private requiredArt: ReadonlyArray<string> = [];

    constructor(
        private readonly bridge: GameBridge,
        private readonly simulation: GameSimulation,
        private readonly onError: (message: string) => void,
    ) {
        super('run');
        this.placeRestoredResult();
    }

    preload(): void {
        this.load.once(Phaser.Loader.Events.FILE_LOAD_ERROR, (): void => {
            this.reportLoadError();
        });

        this.requiredArt = loadRunArt(this, this.simulation.stage, this.simulation.car.stats);
    }

    create(): void {
        if (this.requiredArt.some((key) => !this.textures.exists(key))) {
            this.reportLoadError();
        }

        if (this.hasLoadError) {
            return;
        }

        this.audio = new RunAudio(this.simulation);

        this.events.once(Phaser.Scenes.Events.SHUTDOWN, (): void => {
            this.audio?.stop();
        });

        this.visuals = new RunVisuals(this, this.simulation);
        this.visuals.update(this.simulation);
    }

    private reportLoadError(): void {
        if (this.hasLoadError) {
            return;
        }

        this.hasLoadError = true;
        this.bridge.pauseForError();
        this.onError('Не удалось загрузить изображения заезда. Проверь подключение или обнови приложение.');
    }

    update(_time: number, delta: number): void {
        if (this.hasLoadError) {
            return;
        }

        const state = this.bridge.getSnapshot();

        if (state.isPaused || state.report) {
            this.pauseAudio();

            return;
        }

        if (this.wasPaused) {
            this.simulation.resetClock();
            this.wasPaused = false;
        }

        this.simulation.advance(delta, this.bridge.controls);

        const events = this.feedback.collect(this.simulation);

        this.audio?.update(this.simulation, this.bridge.controls, events);
        playRunHaptics(events);
        this.visuals?.update(this.simulation);

        if (
            this.simulation.rules.reason
            || this.simulation.rules.elapsed - this.lastPublish >= GAME_CONFIG.rendering.snapshotIntervalSeconds
        ) {
            this.publish();
        }
    }

    private pauseAudio(): void {
        this.audio?.stop();

        this.wasPaused = true;
    }

    private placeRestoredResult(): void {
        const report = this.bridge.getSnapshot().report;

        if (!report) {
            return;
        }

        const offsetX = report.distance;
        const track = this.simulation.stage.track;
        const startX = vehicleConfig(this.simulation.car.stats.vehicleId).settings.startX;
        const offsetY = terrainHeight(startX + offsetX, track) - terrainHeight(startX, track);

        this.simulation.car.bodies.forEach((body): void => {
            const position = body.getPosition();

            body.setPosition(Vec2(position.x + offsetX, position.y + offsetY));
        });
    }

    private publish(): void {
        const simulation = this.simulation;

        this.lastPublish = simulation.rules.elapsed;

        if (simulation.rules.reason === 'finish') {
            HAPTICS.success();
        }

        this.bridge.publish({
            distance: simulation.rules.distance,
            speed: Math.abs(simulation.car.chassis.getLinearVelocity().x) * 3.6,
            fuelRatio: simulation.car.fuel / simulation.car.stats.fuelSeconds,
            kills: simulation.zombies.killed.size,
            elapsed: simulation.rules.elapsed,
            report: simulation.rules.reason ? simulation.report() : null,
            isPaused: false,
        });
    }
}
