import type { Body } from 'planck';

import { hasSurfaceContact } from '../physics/hasSurfaceContact';

export function groundedWheelCount(wheels: ReadonlyArray<Body>): number {
    return wheels.filter((wheel) => hasSurfaceContact(wheel)).length;
}
