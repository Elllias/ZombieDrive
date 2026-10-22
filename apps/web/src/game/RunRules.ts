import { GAME_CONFIG, type RunReport, type TrackConfig } from '@zombie-drive/shared';

import type { Car } from './car/Car';

export class RunRules {
    elapsed = 0;
    distance = 0;
    reason: RunReport['reason'] | null = null;
    private rolloverTime = 0;
    private lastProgressTime = 0;
    private progressCheckpoint: number;

    constructor(
        private readonly track: TrackConfig = GAME_CONFIG.track,
        private readonly startX: number = GAME_CONFIG.car.startX,
    ) {
        this.progressCheckpoint = startX;
    }

    afterStep(car: Car): void {
        if (this.reason) {
            return;
        }

        const settings = GAME_CONFIG.run;

        this.elapsed += GAME_CONFIG.world.stepSeconds;

        this.distance = Math.min(
            this.track.length,
            Math.max(this.distance, car.chassis.getPosition().x - this.startX),
        );

        const currentX = car.chassis.getPosition().x;

        if (Math.abs(currentX - this.progressCheckpoint) >= settings.progressThreshold) {
            this.progressCheckpoint = currentX;
            this.lastProgressTime = this.elapsed;
        }

        const isOverturned = Math.cos(car.chassis.getAngle()) < settings.upsideDownCosine;

        this.rolloverTime =
            isOverturned && car.isTouchingSurface() ? this.rolloverTime + GAME_CONFIG.world.stepSeconds : 0;

        this.reason = this.endReason(car);
    }

    private endReason(car: Car): RunReport['reason'] | null {
        const settings = GAME_CONFIG.run;

        if (this.distance >= this.track.length) {
            return 'finish';
        }

        if (this.rolloverTime >= settings.rolloverSeconds) {
            return 'rollover';
        }

        if (car.fuel <= 0 && car.chassis.getLinearVelocity().length() < settings.stopSpeed) {
            return 'fuel';
        }

        if (this.elapsed >= settings.activeLimitSeconds) {
            return 'timeout';
        }

        if (this.elapsed - this.lastProgressTime >= settings.stuckSeconds) {
            return 'stuck';
        }

        return null;
    }
}
