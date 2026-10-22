import type { CSSProperties } from 'react';
import { expect, it } from 'vitest';

import { carStats, vehicleConfig } from '@zombie-drive/shared';

import { vehicleStyles } from '../apps/web/src/ui/common/Vehicle.utils';

it.each([ 0, 1, 2, 3, 4, 5 ])(
    'matches the physical axle geometry and floor at tire level %s',
    (tires): void => {
        const styles = vehicleStyles(tires);
        const stats = carStats({ engine: 0, tank: 0, tires, suspension: 0 });
        const { width, height, originY: origin } = vehicleConfig();
        const bodyCenter = percent(styles.body.top) * height + origin * height;

        styles.wheels.forEach((wheel): void => {
            const diameter = percent(wheel.width) * width;
            const top = percent(wheel.top) * height;

            expect(diameter).toBeCloseTo(stats.wheelRadius * 2, 10);
            expect(top + diameter).toBeCloseTo(height, 10);
            expect(top + diameter / 2 - bodyCenter).toBeCloseTo(stats.axleHeight, 10);
        });
    },
);

function percent(value: CSSProperties['top']): number {
    if (typeof value !== 'string' || !value.endsWith('%')) {
        throw new Error('Expected a percentage');
    }

    return Number.parseFloat(value) / 100;
}
