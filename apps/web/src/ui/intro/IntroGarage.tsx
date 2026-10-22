import type { ReactElement } from 'react';

import { stageConfig, type Progress } from '@zombie-drive/shared';

import { Vehicle } from '../common/Vehicle';

export function IntroGarage({ progress }: { progress?: Progress }): ReactElement {
    const stage = stageConfig(progress?.stageId);

    return (
        <div className={`garage intro-garage-layout ${ stage.vehicleId }-garage`}>
            <div className="garage-toolbar" />

            <section className="garage-scene">
                <div className="garage-vehicle">
                    <Vehicle vehicleId={stage.vehicleId} tireLevel={progress?.upgrades.tires}
                        plowLevel={progress?.upgrades.plow} />
                </div>
            </section>

            <div className="upgrade-rack intro-garage-rack" />
        </div>
    );
}
