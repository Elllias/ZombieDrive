import type { Body } from 'planck';

import { GAME_CONFIG } from '@zombie-drive/shared';

import type { WheelSupport } from './wheelSupport';

export class TiltController {
    private airSeconds = 0;
    private surfaceAngle = 0;
    private hasTiltInput = false;

    constructor(private readonly chassis: Body) {}

    update(tilt: number, support: WheelSupport): void {
        const settings = GAME_CONFIG.car;

        this.updateSupport(tilt, support);

        const isAirborne = this.airSeconds > settings.airControlGraceSeconds;
        const isBraking = isAirborne && tilt === 0 && this.hasTiltInput;

        this.configureRotation(isAirborne, isBraking);

        if (!isAirborne && support.wheels === 2 && tilt === 0) {
            this.hasTiltInput = false;
        }

        if (tilt === 0 && !isBraking) {
            return;
        }

        const targetSpeed = isAirborne ? tilt * settings.airAngularSpeed : this.groundSpeed(tilt);

        this.applyControl(targetSpeed, isAirborne);
    }

    private updateSupport(tilt: number, support: WheelSupport): void {
        this.airSeconds = support.wheels ? 0 : this.airSeconds + GAME_CONFIG.world.stepSeconds;

        if (support.wheels) {
            this.surfaceAngle = support.angle;
        }

        if (tilt !== 0) {
            this.hasTiltInput = true;
        }
    }

    private configureRotation(isAirborne: boolean, isBraking: boolean): void {
        const settings = GAME_CONFIG.car;
        const airDamping = isBraking ? settings.airReleaseDamping : settings.airAngularDamping;

        this.chassis.setAngularDamping(isAirborne ? airDamping : settings.angularDamping);

        this.chassis.setAngularVelocity(
            Math.max(
                -settings.airAngularSpeed,
                Math.min(settings.airAngularSpeed, this.chassis.getAngularVelocity()),
            ),
        );
    }

    private groundSpeed(tilt: number): number {
        const settings = GAME_CONFIG.car;
        const lean = tilt * (tilt < 0 ? settings.wheelieAngle : settings.stoppieAngle);
        const difference = this.surfaceAngle + lean - this.chassis.getAngle();
        const error = Math.atan2(Math.sin(difference), Math.cos(difference));

        return Math.max(
            -settings.groundAngularSpeed,
            Math.min(settings.groundAngularSpeed, error * settings.groundAngleResponse),
        );
    }

    private applyControl(targetSpeed: number, isAirborne: boolean): void {
        const settings = GAME_CONFIG.car;
        const response = isAirborne ? settings.airControlResponse : settings.groundControlResponse;
        const limit = isAirborne ? settings.airAngularAcceleration : settings.groundAngularAcceleration;
        const requested = (targetSpeed - this.chassis.getAngularVelocity()) * response;
        const acceleration = Math.max(-limit, Math.min(limit, requested));

        this.chassis.applyTorque(this.chassis.getInertia() * acceleration, true);
    }
}
