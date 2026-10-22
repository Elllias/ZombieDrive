import { beforeEach, afterEach, expect, it, vi } from 'vitest';

import { GameBridge } from '../apps/web/src/game/GameBridge';
import { InputController } from '../apps/web/src/ui/run/InputController';

import { browser, scriptAt, sdk } from './telegram-sdk.helpers';

const hooks = vi.hoisted(() => ({ cleanups: new Array<() => void>() }));

vi.mock('react', () => ({
    useEffect: (effect: () => (() => void)): void => {
        hooks.cleanups.push(effect());
    },
}));

beforeEach((): void => {
    vi.resetModules();
});

afterEach((): void => {
    hooks.cleanups.splice(0).forEach((cleanup): void => cleanup());
    vi.unstubAllGlobals();
});

it('initializes a slow SDK before binding back navigation and pause events for a run', async (): Promise<void> => {
    const scripts = browser();
    const app = sdk();
    const { initializeTelegram } = await import('../apps/web/src/platform/telegram');
    const { useRunLifecycle } = await import('../apps/web/src/ui/run/useRunLifecycle');
    const ready = initializeTelegram();

    expect(app.ready).not.toHaveBeenCalled();
    window.Telegram = { WebApp: app };
    scriptAt(scripts).dispatchEvent(new Event('load'));
    await ready;

    const bridge = new GameBridge();

    useRunLifecycle(bridge, new InputController(bridge));
    expect(app.ready).toHaveBeenCalledOnce();
    expect(app.BackButton.show).toHaveBeenCalledOnce();
    expect(app.BackButton.onClick).toHaveBeenCalledOnce();
    pauseEvent(app);
    expect(bridge.getSnapshot().isPaused).toBe(true);
});

function pauseEvent(app: ReturnType<typeof sdk>): void {
    const pause = vi.mocked(app.onEvent).mock.calls.find(([ event ]) => event === 'deactivated')?.[1];

    expect(pause).toBeDefined();
    pause?.();
}
