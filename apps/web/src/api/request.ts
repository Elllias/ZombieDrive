import type { ZodType } from 'zod';

import { ErrorSchema } from '@zombie-drive/shared';

import { ApiError } from './ApiError';
import { isConnectionError } from './isConnectionError';

export async function request<T>(path: string, schema: ZodType<T>, body?: unknown): Promise<T> {
    const response = await fetch(`/api${ path }`, {
        method: body === undefined ? 'GET' : 'POST',
        headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
        credentials: 'include',
        signal: AbortSignal.timeout(15000),
    });

    const data = await readResponseData(response);

    if (!response.ok) {
        const parsed = ErrorSchema.safeParse(data);

        throw new ApiError(response.status, parsed.success ? parsed.data.message : 'Сервер недоступен. Повторите попытку.');
    }

    const parsed = schema.safeParse(data);

    if (!parsed.success) {
        throw new Error('Не удалось загрузить данные. Повторите попытку.');
    }

    return parsed.data;
}

async function readResponseData(response: Response): Promise<unknown> {
    try {
        return await response.json();
    } catch (error: unknown) {
        if (response.ok && isConnectionError(error)) {
            throw error;
        }

        throw new ApiError(response.status, 'Сервер недоступен. Повторите попытку.');
    }
}
