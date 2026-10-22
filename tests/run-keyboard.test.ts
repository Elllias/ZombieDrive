import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { GameBridge } from '../apps/web/src/game/GameBridge';
import { InputController } from '../apps/web/src/ui/run/InputController';
import { bindRunKeyboard } from '../apps/web/src/ui/run/runKeyboard';

beforeEach((): void => {
    vi.stubGlobal('window', Object.assign(new EventTarget(), { innerWidth: 915, innerHeight: 412 }));
});

afterEach((): void => {
    vi.unstubAllGlobals();
});

function key(type: string, code: string): Event {
    const event = Object.assign(new Event(type, { cancelable: true }), { code });

    window.dispatchEvent(event);

    return event;
}

it('starts the introduction with gas, releases it and clears controls on pause', (): void => {
    const bridge = new GameBridge();
    const cleanup = bindRunKeyboard(new InputController(bridge), bridge);

    bridge.pause();
    expect(key('keydown', 'ArrowRight').defaultPrevented).toBe(true);
    expect(bridge.getSnapshot().isPaused).toBe(false);
    expect(bridge.controls.gas).toBe(true);
    key('keyup', 'ArrowRight');
    expect(bridge.controls.gas).toBe(false);
    key('keydown', 'KeyQ');
    key('keydown', 'Escape');
    expect(bridge.getSnapshot().isPaused).toBe(true);
    expect(bridge.controls).toEqual({ gas: false, brake: false, tilt: 0 });
    cleanup();
});

it('leaves scrolling keys available on the result screen and ignores driving input', (): void => {
    const bridge = new GameBridge();
    const cleanup = bindRunKeyboard(new InputController(bridge), bridge);

    bridge.abandon();
    expect(key('keydown', 'ArrowRight').defaultPrevented).toBe(false);
    expect(bridge.controls.gas).toBe(false);
    key('keydown', 'Escape');
    expect(bridge.getSnapshot().isPaused).toBe(false);
    cleanup();
});

it('removes its listeners when leaving the run', (): void => {
    const bridge = new GameBridge();
    const cleanup = bindRunKeyboard(new InputController(bridge), bridge);

    cleanup();
    expect(key('keydown', 'ArrowRight').defaultPrevented).toBe(false);
    expect(bridge.controls.gas).toBe(false);
});
