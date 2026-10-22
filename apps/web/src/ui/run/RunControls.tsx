import type { ReactElement } from 'react';

import type { InputController } from './InputController';
import { Pedal } from './Pedal';

export function RunControls({ input }: { input: InputController }): ReactElement {
    return (
        <div className="run-controls">
            <div className="tilt-controls">
                <Pedal action="tiltLeft" label="↶" input={input} />
                <Pedal action="tiltRight" label="↷" input={input} />
            </div>

            <div className="drive-controls">
                <Pedal action="brake" label="Тормоз" input={input} />
                <Pedal action="gas" label="Газ" input={input} />
            </div>
        </div>
    );
}
