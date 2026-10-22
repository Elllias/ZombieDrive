import { afterEach, expect, it, vi } from 'vitest';

import { API } from '../apps/web/src/api/client';

import { browser, sdk } from './telegram-sdk.helpers';

afterEach((): void => {
    vi.unstubAllGlobals();
});

it('sends the original Telegram initData to the server when creating a session', async (): Promise<void> => {
    browser();
    window.Telegram = { WebApp: { ...sdk(), initData: 'original-signed-launch-data' } };

    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(Response.json({ ready: true }));

    vi.stubGlobal('fetch', fetch);
    await API.session();
    expect(fetch.mock.calls[0]?.[1]?.body).toBe(JSON.stringify({ initData: 'original-signed-launch-data' }));
});

it('keeps guest access when launched in a normal browser without Telegram identity', async (): Promise<void> => {
    browser();
    window.Telegram = { WebApp: { ...sdk(), initData: '' } };

    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(Response.json({ ready: true }));

    vi.stubGlobal('fetch', fetch);
    await API.session();
    expect(fetch.mock.calls[0]?.[1]?.body).toBe('{}');
});
