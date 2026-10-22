import { vehicleConfig, type VehicleId } from '@zombie-drive/shared';

import type { Controls } from '../physics/types';

interface DriveOptions {
    speed: number;
    hasFuel: boolean;
    torque: number;
    vehicleId?: VehicleId;
}

interface DriveCommand {
    speed: number;
    torque: number;
    isDriving: boolean;
}

export function driveCommand(controls: Controls, options: DriveOptions): DriveCommand {
    const settings = vehicleConfig(options.vehicleId).settings;

    if (controls.brake) {
        const isReversing = options.hasFuel && options.speed < settings.reverseThreshold;

        return {
            speed: isReversing ? settings.reverseMotorSpeed : 0,
            torque: isReversing ? options.torque : settings.brakeTorque,
            isDriving: isReversing,
        };
    }

    const isDriving = options.hasFuel && controls.gas;

    return {
        speed: isDriving ? settings.motorSpeed : 0,
        torque: isDriving ? options.torque : 0,
        isDriving,
    };
}
