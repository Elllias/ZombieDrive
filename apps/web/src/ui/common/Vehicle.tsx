import type { ReactElement } from 'react';

import { plowAppearance, vehicleConfig, type VehicleId } from '@zombie-drive/shared';

import { vehicleStyles } from './Vehicle.utils';
import { WheelWells } from './WheelWells';

export function Vehicle(props: { tireLevel?: number; vehicleId?: VehicleId; plowLevel?: number }): ReactElement {
    const tireLevel = props.tireLevel ?? 0;
    const vehicle = vehicleConfig(props.vehicleId);
    const styles = vehicleStyles(tireLevel, props.vehicleId);
    const plow = plowAppearance(props.vehicleId);

    return (
        <div key={vehicle.bodyArt} className="vehicle-art" role="img"
            aria-label={`${ vehicle.title }, колёса уровня ${ tireLevel }`}
            style={{ aspectRatio: `${ vehicle.width } / ${ vehicle.height }` }}>
            <WheelWells vehicleId={props.vehicleId} style={styles.body} />

            {styles.wheels.map((style, index) => (
                <img key={`${ tireLevel }:${ index }`} width={512} height={512} className="vehicle-wheel"
                    style={style} src={`/art/wheel-${ tireLevel }.webp`} decoding="async" alt="" />
            ))}

            <img className="vehicle-body" style={styles.body} src={vehicle.bodyArt}
                width={vehicle.width * 100} height={vehicle.height * 100} decoding="async" alt="" />

            {!!props.plowLevel && <img className="vehicle-plow" style={styles.plow} src={plow.art} alt="" />}
        </div>
    );
}
