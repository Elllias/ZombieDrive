import type { CSSProperties, ReactElement } from 'react';

import { GAME_CONFIG, vehicleConfig, type VehicleId } from '@zombie-drive/shared';

export function WheelWells(props: { vehicleId?: VehicleId; style: CSSProperties }): ReactElement {
    const outlines = vehicleConfig(props.vehicleId).wheelWells;
    const fill = `#${ GAME_CONFIG.rendering.wheelWellColor.toString(16).padStart(6, '0') }`;

    return (
        <svg className="vehicle-wheel-wells" style={props.style}
            viewBox="0 0 1 1" preserveAspectRatio="none" aria-hidden="true">
            {outlines.map((outline, index) => (
                <polygon key={index} fill={fill} points={outline.map((point) => `${ point.x },${ point.y }`).join(' ')} />
            ))}
        </svg>
    );
}
