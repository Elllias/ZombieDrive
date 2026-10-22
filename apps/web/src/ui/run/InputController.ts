import type { GameBridge } from '../../game/GameBridge';

import type { InputAction } from '../../configs/controls';

export class InputController {
    private held = new Map<string, InputAction>();

    constructor(private bridge: GameBridge) {}

    press(action: InputAction, source: string): void {
        if (this.bridge.getSnapshot().isPaused) {
            return;
        }

        this.held.set(source, action);
        this.publish();
    }

    release(source: string): void {
        this.held.delete(source);
        this.publish();
    }

    clear(): void {
        this.held.clear();
        this.publish();
    }

    private publish(): void {
        const actions = [ ...this.held.values() ];

        this.bridge.controls = {
            gas: actions.includes('gas'),
            brake: actions.includes('brake'),
            tilt: Number(actions.includes('tiltRight')) - Number(actions.includes('tiltLeft')),
        };
    }
}
