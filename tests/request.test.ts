import { afterEach, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { request } from '../apps/web/src/api/request';

const SCHEMA = z.object({ ready: z.boolean() });

afterEach((): void => {
    vi.unstubAllGlobals();
});

function respond(response: Response): void {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(response));
}

it('handles an empty response during a server restart without exposing a JSON exception', async (): Promise<void> => {
    respond(new Response('', { status: 502 }));
    await expect(request('/session', SCHEMA)).rejects.toThrow('Сервер недоступен. Повторите попытку.');
});

it('keeps the server error message for a rejected request', async (): Promise<void> => {
    respond(Response.json({ message: 'Недостаточно валюты.' }, { status: 409 }));
    await expect(request('/session', SCHEMA)).rejects.toThrow('Недостаточно валюты.');
});

it('handles incompatible response data without exposing validation internals', async (): Promise<void> => {
    respond(Response.json({ ready: 'yes' }));

    await expect(request('/session', SCHEMA)).rejects.toThrow(
        'Не удалось загрузить данные. Повторите попытку.',
    );
});

it('returns validated response data', async (): Promise<void> => {
    respond(Response.json({ ready: true }));
    await expect(request('/session', SCHEMA)).resolves.toEqual({ ready: true });
});

it.each([ 404, 422, 502 ])('keeps HTTP %s when the response has no JSON body', async (status): Promise<void> => {
    respond(new Response('', { status }));

    await expect(request('/session', SCHEMA)).rejects.toMatchObject({ status });
});

it('preserves an interrupted successful response for connection recovery', async (): Promise<void> => {
    const error = new DOMException('Fetch is aborted', 'AbortError');

    const response = new Response(new ReadableStream({
        start(controller): void {
            controller.error(error);
        },
    }));

    respond(response);
    await expect(request('/session', SCHEMA)).rejects.toBe(error);
});

it('keeps a known HTTP rejection when reading its error body is aborted', async (): Promise<void> => {
    const response = new Response(new ReadableStream({
        start(controller): void {
            controller.error(new DOMException('Fetch is aborted', 'AbortError'));
        },
    }), { status: 422 });

    respond(response);
    await expect(request('/session', SCHEMA)).rejects.toMatchObject({ status: 422 });
});
