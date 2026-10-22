import type { InputAction } from '../../configs/controls';

import type { InputController } from './InputController';

export interface PedalProps {
    action: InputAction;
    label: string;
    input: InputController;
}
