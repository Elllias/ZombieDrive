import type { GameBridge } from '../../game/GameBridge';

import type { InputController } from './InputController';
import { KEY_ACTIONS } from '../../configs/controls';

export function bindRunKeyboard(input: InputController, bridge: GameBridge): () => void {
    const down = (event: KeyboardEvent): void => handleKeyDown(event, input, bridge);
    const up = (event: KeyboardEvent): void => input.release(event.code);

    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);

    return (): void => {
        window.removeEventListener('keydown', down);
        window.removeEventListener('keyup', up);
    };
}

function handleKeyDown(event: KeyboardEvent, input: InputController, bridge: GameBridge): void {
    if (bridge.getSnapshot().report) {
        return;
    }

    const action = KEY_ACTIONS[event.code];

    if (action) {
        event.preventDefault();
        resumeIntroduction(bridge, action);
        input.press(action, event.code);
    }

    if (event.code === 'Escape') {
        input.clear();
        bridge.pause();
    }
}

function resumeIntroduction(bridge: GameBridge, action: string): void {
    const state = bridge.getSnapshot();

    if (
        action === 'gas'
        && state.isPaused
        && state.elapsed === 0
        && window.innerWidth >= window.innerHeight
    ) {
        bridge.resume();
    }
}
