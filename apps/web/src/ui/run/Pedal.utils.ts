import type { ButtonHTMLAttributes, KeyboardEvent } from 'react';

import type { InputAction } from '../../configs/controls';

import type { InputController } from './InputController';
import type { PedalProps } from './Pedal.types';

type PedalEvents = Pick<
    ButtonHTMLAttributes<HTMLButtonElement>,
    | 'onPointerDown'
    | 'onPointerUp'
    | 'onPointerCancel'
    | 'onLostPointerCapture'
    | 'onKeyDown'
    | 'onKeyUp'
    | 'onBlur'
>;

export function pedalEvents({ input, action }: Pick<PedalProps, 'input' | 'action'>): PedalEvents {
    return {
        onPointerDown: (event): void => {
            event.currentTarget.setPointerCapture(event.pointerId);
            input.press(action, `pointer-${ event.pointerId }`);
        },

        onPointerUp: (event): void => input.release(`pointer-${ event.pointerId }`),
        onPointerCancel: (event): void => input.release(`pointer-${ event.pointerId }`),
        onLostPointerCapture: (event): void => input.release(`pointer-${ event.pointerId }`),
        onKeyDown: (event): void => pressKey(event, input, action),
        onKeyUp: (): void => input.release(`button-${ action }`),
        onBlur: (): void => input.release(`button-${ action }`),
    };
}

function pressKey(
    event: KeyboardEvent<HTMLButtonElement>,
    input: InputController,
    action: InputAction,
): void {
    if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        input.press(action, `button-${ action }`);
    }
}
