import type { ReactElement } from 'react';

import { plowAppearance, type Upgrade, type VehicleId } from '@zombie-drive/shared';

export function PartIcon({ upgrade, level = 0, vehicleId }: {
    upgrade: Upgrade;
    level?: number;
    vehicleId?: VehicleId;
}): ReactElement {
    if (upgrade === 'plow') {
        return (
            <span className="part-icon part-plow" aria-hidden="true"
                style={{ backgroundImage: `url(${ plowAppearance(vehicleId).art })` }} />
        );
    }

    if (upgrade === 'tires') {
        return (
            <span
                className="part-icon"
                aria-hidden="true"
                style={{ backgroundImage: `url(/art/wheel-${ level }.webp)`, backgroundSize: '100% 100%' }}
            />
        );
    }

    return <span className={`part-icon part-${ upgrade }`} aria-hidden="true" />;
}
