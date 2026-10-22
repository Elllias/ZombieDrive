import type { Body } from 'planck';

import { vehicleConfig, type CarStats } from '@zombie-drive/shared';

import type { PhysicalPart } from '../physics/types';

export function createCarParts(
    chassis: Body,
    wheels: ReadonlyArray<Body>,
    stats: CarStats,
): Array<PhysicalPart> {
    const settings = vehicleConfig(stats.vehicleId).settings;

    return [
        {
            body: chassis,

            shape: {
                kind: 'box',
                halfWidth: settings.chassisHalfWidth,
                halfHeight: settings.chassisHalfHeight,
            },
        },

        ...wheels.map((body): PhysicalPart => ({ body, shape: { kind: 'circle', radius: stats.wheelRadius } })),
    ];
}
