import type { World, Body, WheelJoint } from 'planck';

import { GAME_CONFIG, vehicleConfig, type CarStats, type TrackConfig } from '@zombie-drive/shared';

import type { Controls, PhysicalPart } from '../physics/types';
import { hasSurfaceContact } from '../physics/hasSurfaceContact';

import { createChassis } from './createChassis';
import { createWheel } from './createWheel';
import { driveCommand } from './driveCommand';
import { TiltController } from './TiltController';
import { wheelSupport } from './wheelSupport';
import { groundedWheelCount } from './groundedWheelCount';
import { createCarParts } from './createCarParts';
import { attachPlow } from './attachPlow';

export class Car {
    readonly chassis: Body;
    readonly wheels: Array<Body>;
    readonly bodies: Array<Body>;
    readonly parts: Array<PhysicalPart>;
    private readonly joints: Array<WheelJoint>;
    private readonly tilt: TiltController;
    fuel: number;

    constructor(
        world: World,
        readonly stats: CarStats,
        track: TrackConfig = GAME_CONFIG.track,
    ) {
        this.chassis = createChassis(world, stats, track);
        attachPlow(this.chassis, stats);
        this.tilt = new TiltController(this.chassis);

        const wheels = vehicleConfig(stats.vehicleId).axles.map((offsetX) =>
            createWheel(world, this.chassis, { offsetX, stats }),
        );

        this.wheels = wheels.map((wheel) => wheel.body);
        this.joints = wheels.map((wheel) => wheel.joint);
        this.bodies = [ this.chassis, ...this.wheels ];
        this.fuel = stats.fuelSeconds;
        this.parts = createCarParts(this.chassis, this.wheels, stats);
    }

    beforeStep(controls: Controls): void {
        const settings = vehicleConfig(this.stats.vehicleId).settings;

        const command = driveCommand(controls, {
            speed: this.chassis.getLinearVelocity().x,
            hasFuel: this.fuel > 0,
            torque: this.stats.driveTorque,
            vehicleId: this.stats.vehicleId,
        });

        const drainRate = command.isDriving ? 1 : settings.idleFuelRate;

        this.fuel = Math.max(0, this.fuel - GAME_CONFIG.world.stepSeconds * drainRate);

        this.joints.forEach((joint): void => {
            joint.setMotorSpeed(command.speed);
            joint.setMaxMotorTorque(command.torque);
        });

        this.tilt.update(controls.tilt, wheelSupport(this.wheels));
    }

    isGrounded(): boolean {
        return groundedWheelCount(this.wheels) > 0;
    }

    isTouchingSurface(): boolean {
        return this.bodies.some((body) => hasSurfaceContact(body));
    }
}
