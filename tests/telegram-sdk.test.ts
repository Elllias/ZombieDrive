import { beforeEach, afterEach, expect, it, vi } from 'vitest';

import { browser, scriptAt, sdk } from './telegram-sdk.helpers';

beforeEach((): void => {
    vi.resetModules();
    vi.useFakeTimers();
});

afterEach((): void => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
});

it('waits for the SDK and shares its loading request until Telegram becomes available', async (): Promise<void> => {
    const scripts = browser();
    const { loadTelegramSdk } = await import('../apps/web/src/platform/loadTelegramSdk');
    const first = loadTelegramSdk();
    const second = loadTelegramSdk();
    const complete = vi.fn<() => void>();

    void first.then(complete);
    await Promise.resolve();
    expect(scripts).toHaveLength(1);
    expect(complete).not.toHaveBeenCalled();
    window.Telegram = { WebApp: sdk() };
    scriptAt(scripts).dispatchEvent(new Event('load'));
    await Promise.all([ first, second ]);
    await loadTelegramSdk();

    expect(complete).toHaveBeenCalledOnce();
    expect(scripts).toHaveLength(1);
    expect(vi.getTimerCount()).toBe(0);
});

it('removes a failed SDK request and allows a successful retry', async (): Promise<void> => {
    const scripts = browser();
    const { loadTelegramSdk } = await import('../apps/web/src/platform/loadTelegramSdk');
    const first = loadTelegramSdk();
    const rejected = expect(first).rejects.toThrow('loading failed');

    scriptAt(scripts).dispatchEvent(new Event('error'));
    await rejected;
    expect(scriptAt(scripts).isRemoved).toBe(true);

    const second = loadTelegramSdk();

    window.Telegram = { WebApp: sdk() };
    scriptAt(scripts, 1).dispatchEvent(new Event('load'));
    await expect(second).resolves.toBeUndefined();
    expect(vi.getTimerCount()).toBe(0);
});

it('ends a stalled SDK request after the timeout and allows another request', async (): Promise<void> => {
    const scripts = browser();
    const { loadTelegramSdk } = await import('../apps/web/src/platform/loadTelegramSdk');
    const rejected = expect(loadTelegramSdk()).rejects.toThrow('timed out');

    await vi.advanceTimersByTimeAsync(15000);
    await rejected;
    expect(scriptAt(scripts).isRemoved).toBe(true);

    const retry = loadTelegramSdk();

    window.Telegram = { WebApp: sdk() };
    scriptAt(scripts, 1).dispatchEvent(new Event('load'));
    await expect(retry).resolves.toBeUndefined();
});

it('rejects a loaded script that did not expose Telegram WebApp', async (): Promise<void> => {
    const scripts = browser();
    const { loadTelegramSdk } = await import('../apps/web/src/platform/loadTelegramSdk');
    const rejected = expect(loadTelegramSdk()).rejects.toThrow('did not initialize');

    scriptAt(scripts).dispatchEvent(new Event('load'));
    await rejected;
    expect(scriptAt(scripts).isRemoved).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
});

it('uses an already loaded SDK without requesting it again', async (): Promise<void> => {
    const scripts = browser();
    const { loadTelegramSdk } = await import('../apps/web/src/platform/loadTelegramSdk');

    window.Telegram = { WebApp: sdk() };
    await expect(loadTelegramSdk()).resolves.toBeUndefined();
    expect(scripts).toHaveLength(0);
});
