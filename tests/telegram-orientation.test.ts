import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { bindLandscapeOrientation } from '../apps/web/src/platform/bindLandscapeOrientation';

import { browser, sdk } from './telegram-sdk.helpers';

let app: ReturnType<typeof sdk>;
let cleanup: (() => void) | null = null;

beforeEach((): void => {
    browser();
    app = sdk();
    app.lockOrientation = vi.fn();
    app.unlockOrientation = vi.fn();
    window.Telegram = { WebApp: app };
});

afterEach((): void => {
    cleanup?.();
    cleanup = null;
    vi.unstubAllGlobals();
});

it('locks landscape for the run and restores normal orientation after leaving', (): void => {
    cleanup = bindLandscapeOrientation();
    expect(app.lockOrientation).toHaveBeenCalledOnce();
    window.dispatchEvent(new Event('resize'));
    expect(app.lockOrientation).toHaveBeenCalledOnce();
    cleanup();
    cleanup = null;
    expect(app.unlockOrientation).toHaveBeenCalledOnce();
    window.dispatchEvent(new Event('resize'));
    expect(app.lockOrientation).toHaveBeenCalledOnce();
});

it('waits for a portrait phone to rotate before locking', (): void => {
    Object.assign(window, { innerWidth: 412, innerHeight: 915 });
    cleanup = bindLandscapeOrientation();
    expect(app.lockOrientation).not.toHaveBeenCalled();
    Object.assign(window, { innerWidth: 915, innerHeight: 412 });
    window.dispatchEvent(new Event('resize'));
    expect(app.lockOrientation).toHaveBeenCalledOnce();
});

it('also responds to Telegram viewport changes after a rotation', (): void => {
    Object.assign(window, { innerWidth: 412, innerHeight: 915 });
    cleanup = bindLandscapeOrientation();

    const update = vi.mocked(app.onEvent).mock.calls.find(([ event ]) => event === 'viewportChanged')?.[1];

    Object.assign(window, { innerWidth: 915, innerHeight: 412 });
    update?.();
    expect(app.lockOrientation).toHaveBeenCalledOnce();
});

it('does not unlock an orientation lock owned by another part of the app', (): void => {
    app.isOrientationLocked = true;
    cleanup = bindLandscapeOrientation();
    cleanup();
    cleanup = null;
    expect(app.lockOrientation).not.toHaveBeenCalled();
    expect(app.unlockOrientation).not.toHaveBeenCalled();
});

it('handles older clients and native orientation failures without blocking play', (): void => {
    vi.mocked(app.isVersionAtLeast).mockReturnValue(false);
    cleanup = bindLandscapeOrientation();
    expect(app.lockOrientation).not.toHaveBeenCalled();
    cleanup();
    vi.mocked(app.isVersionAtLeast).mockReturnValue(true);

    app.lockOrientation = (): never => {
        throw new Error('Unsupported');
    };

    expect(() => {
        cleanup = bindLandscapeOrientation();
    }).not.toThrow();
});
