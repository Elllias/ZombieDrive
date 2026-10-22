import {
    GAME_CONFIG,
    stageConfig,
    stageForVehicle,
    vehicleConfig,
    type StageConfig,
    type CarStats,
    type RunReport,
} from '@zombie-drive/shared';

import { Car } from './car/Car';
import { Zombies } from './zombies/Zombies';
import { createWorld } from './physics/createWorld';
import { FixedStep } from './physics/FixedStep';
import { PoseTracker } from './physics/PoseTracker';
import type { Controls, PhysicalPart, ViewBounds } from './physics/types';
import { RunRules } from './RunRules';
import { Crates } from './crates/Crates';
import { ImpactResistance } from './physics/ImpactResistance';
import { obstacles } from './physics/obstacles';
import { Barrels } from './barrels/Barrels';
import type { SimulationOptions } from './SimulationOptions';

export class GameSimulation {
    readonly world;
    readonly car: Car;
    readonly zombies: Zombies;
    readonly crates: Crates;
    readonly rules: RunRules;
    readonly stage: StageConfig;
    readonly barrels: Barrels;
    readonly poses = new PoseTracker();
    private readonly clock = new FixedStep();
    private readonly impacts: ImpactResistance;
    private viewWidth: number = GAME_CONFIG.rendering.width;
    alpha = 0;

    constructor(stats: CarStats, options: SimulationOptions = {}) {
        this.stage = options.stageId ? stageConfig(options.stageId) : stageForVehicle(stats.vehicleId);

        const track = this.stage.track;
        const barrels = options.barrelSpawns ?? this.stage.barrels;

        this.world = createWorld(options.isFlat, track);
        this.rules = new RunRules(track, vehicleConfig(stats.vehicleId).settings.startX);
        this.car = new Car(this.world, stats, track);

        this.zombies = new Zombies(this.world, this.car.bodies, options.spawns ?? this.stage.zombies, {
            track,
            canHitBarrels: barrels.length > 0,
        });

        this.crates = new Crates(this.world, this.car.bodies, options.crateSpawns ?? this.stage.crates, track);

        this.barrels = new Barrels(this.world, barrels, {
            track,
            car: this.car,
            zombies: this.zombies,
            crates: this.crates,
        });

        this.impacts = new ImpactResistance(
            this.world,
            this.car.bodies,
            obstacles(this.zombies, this.crates),
            stats.plowLevel ?? 0,
        );
    }

    advance(deltaMilliseconds: number, controls: Controls): void {
        this.alpha = this.clock.advance(deltaMilliseconds, (): void => this.step(controls));
    }

    step(controls: Controls): void {
        if (this.rules.reason) {
            return;
        }

        const settings = GAME_CONFIG.world;

        this.beforeStep(controls);
        this.world.step(settings.stepSeconds, settings.velocityIterations, settings.positionIterations);
        this.afterStep();
    }

    private beforeStep(controls: Controls): void {
        this.poses.beforeStep(this.parts.map((part) => part.body));
        this.car.beforeStep(controls);
        this.zombies.beforeStep(this.view, this.car.parts);
        this.crates.beforeStep(this.car.chassis.getPosition().x);
        this.barrels.beforeStep(this.car.chassis.getPosition().x);
        this.impacts.beforeStep();
    }

    private afterStep(): void {
        this.impacts.afterStep();
        this.barrels.afterStep();
        this.zombies.afterStep();
        this.crates.afterStep();
        this.rules.afterStep(this.car);
    }

    resetClock(): void {
        this.clock.reset();
    }

    get parts(): Array<PhysicalPart> {
        return [
            ...this.car.parts,
            ...this.zombies.actors.flatMap((zombie) => zombie.parts),
            ...this.crates.parts,
            ...this.barrels.parts,
        ];
    }

    setViewWidth(width: number): void {
        this.viewWidth = width;
    }

    get view(): ViewBounds {
        const halfWidth = this.viewWidth / GAME_CONFIG.rendering.pixelsPerMeter / 2;
        const lead = Math.min(GAME_CONFIG.rendering.cameraLead, halfWidth / 2);
        const centerX = this.car.chassis.getPosition().x + lead;
        const centerY = this.car.chassis.getPosition().y - GAME_CONFIG.rendering.cameraHeight;
        const halfHeight = GAME_CONFIG.rendering.height / GAME_CONFIG.rendering.pixelsPerMeter / 2;

        return {
            left: centerX - halfWidth,
            right: centerX + halfWidth,
            top: centerY - halfHeight,
            bottom: centerY + halfHeight,
        };
    }

    report(reason: RunReport['reason'] = this.rules.reason ?? 'abandon'): RunReport {
        return {
            distance: this.rules.distance,
            elapsedSeconds: this.rules.elapsed,
            killedZombieIds: [ ...this.zombies.killed ],
            reason,
        };
    }
}
