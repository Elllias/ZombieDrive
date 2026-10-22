import type { FastifyInstance } from 'fastify';

import { ErrorSchema, RunSchema, type Run } from '@zombie-drive/shared';

import { ApiError } from '../apps/web/src/api/ApiError';
import type { AppState } from '../apps/web/src/state/types';

import { send } from './api.helpers';

export async function startRequest(app: FastifyInstance, cookie: string, key: string): Promise<Run> {
    const response = await send(app, cookie, { method: 'POST', url: '/api/runs', payload: { key } });
    const data: unknown = response.json();

    if (response.statusCode !== 200) {
        throw new ApiError(response.statusCode, ErrorSchema.parse(data).message);
    }

    return RunSchema.parse(data);
}

export function enteredRun(states: ReadonlyArray<AppState>): Run {
    const last = states.at(-1);

    if (last?.screen !== 'run') {
        throw new Error('Expected a playable run');
    }

    return last.run;
}
