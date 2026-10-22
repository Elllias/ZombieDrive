import type { ReactElement } from 'react';

import { ENDING_ART } from '../../configs/scenes/ending';

export function EndingBarrier(): ReactElement {
    return (
        <div className="ending-barrier">
            <div className="ending-barrier-shadow" />

            <img className="ending-barrier-arm" {...ENDING_ART.barrierArm} alt="" draggable={false} />

            <img className="ending-barrier-post" {...ENDING_ART.barrierPost} alt="" draggable={false} />
        </div>
    );
}
