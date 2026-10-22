import Fastify, { type FastifyInstance } from 'fastify';
import cookie from '@fastify/cookie';
import type { Pool } from 'pg';

import { DomainError } from './domain/errors';
import { registerRoutes } from './routes';
import { registerErrorHandler } from './registerErrorHandler';

export async function createApp(options: {
    pool: Pool;
    origin: string;
    logger?: boolean;
    telegramBotToken?: string;
}): Promise<FastifyInstance> {
    const app = Fastify({ logger: options.logger ?? false, bodyLimit: 16384 });

    await app.register(cookie);

    app.addHook('onRequest', async (request): Promise<void> => {
        if (request.method !== 'GET' && request.headers.origin && request.headers.origin !== options.origin) {
            throw new DomainError(403, 'Этот адрес не может изменять игровой прогресс.');
        }
    });

    registerErrorHandler(app);

    registerRoutes(app, options.pool, {
        secure: options.origin.startsWith('https://'), botToken: options.telegramBotToken,
    });

    return app;
}
