import type { CSSProperties } from 'react';

import { carGeometry, plowAppearance, vehicleConfig, type VehicleId } from '@zombie-drive/shared';

export function vehicleStyles(
    tireLevel: number,
    vehicleId: VehicleId = 'suv',
): { body: CSSProperties; wheels: Array<CSSProperties>; plow: CSSProperties } {
    const { wheelRadius, axleHeight } = carGeometry(tireLevel, vehicleId);
    const { width, height, originY: origin, axles, garageWheelLift = 0, foregroundAxles } = vehicleConfig(vehicleId);
    const wheelTop = ((height - wheelRadius * 2) / height) * 100;
    const chassisY = height - wheelRadius - axleHeight + garageWheelLift;
    const bodyTop = ((chassisY - height * origin) / height) * 100;

    return {
        body: { top: `${ bodyTop }%` },

        wheels: axles.map((offset, index) => ({
            width: `${ (wheelRadius * 2 / width) * 100 }%`,
            height: `${ (wheelRadius * 2 / height) * 100 }%`,
            top: `${ wheelTop }%`,
            left: `${ ((width / 2 + offset - wheelRadius) / width) * 100 }%`,
            zIndex: foregroundAxles?.includes(index) ? 3 : 1,
        })),

        plow: plowStyles(chassisY, vehicleId),
    };
}

function plowStyles(chassisY: number, vehicleId: VehicleId): CSSProperties {
    const { width, height } = vehicleConfig(vehicleId);
    const plow = plowAppearance(vehicleId);

    return {
        width: `${ plow.width / width * 100 }%`,
        height: `${ plow.height / height * 100 }%`,
        left: `${ (width / 2 + plow.x - plow.width / 2) / width * 100 }%`,
        top: `${ (chassisY + plow.y - plow.height / 2) / height * 100 }%`,
    };
}
