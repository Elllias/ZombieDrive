import type { FastifyInstance } from 'fastify';
import type { Pool } from 'pg';

import { SessionInputSchema } from '@zombie-drive/shared';

import { SESSION_COOKIE, SESSION_MAX_AGE } from '../configs/auth';
import { createSession } from '../session';

export interface SessionOptions {
    secure: boolean;
    botToken?: string;
}

export function registerSession(app: FastifyInstance, pool: Pool, options: SessionOptions): void {
    app.post('/api/session', async (request, reply): Promise<{ ready: boolean }> => {
        const input = SessionInputSchema.parse(request.body ?? {});

        const token = await createSession(pool, {
            previous: request.cookies[SESSION_COOKIE], initData: input.initData, botToken: options.botToken,
        });

        reply.setCookie(SESSION_COOKIE, token, {
            httpOnly: true,
            sameSite: 'lax',
            secure: options.secure,
            path: '/',
            maxAge: SESSION_MAX_AGE,
        });

        return { ready: true };
    });
}
