import type { FastifyInstance } from 'fastify';
import { ZodError } from 'zod';

import { DomainError } from './domain/errors';

export function registerErrorHandler(app: FastifyInstance): void {
    app.setErrorHandler((error, request, reply): void => {
        if (error instanceof ZodError) {
            reply.code(400).send({ message: 'Некорректный запрос.' });

            return;
        }

        if (error instanceof DomainError) {
            reply.code(error.statusCode).send({ message: error.message });

            return;
        }

        const status = clientErrorStatus(error);

        if (status) {
            reply.code(status).send({ message: 'Некорректный запрос.' });

            return;
        }

        request.log.error(error);
        reply.code(500).send({ message: 'Сервер недоступен. Повторите запрос.' });
    });
}

function clientErrorStatus(error: unknown): number | null {
    if (!(error instanceof Error) || !('statusCode' in error)) {
        return null;
    }

    const status = error.statusCode;

    return typeof status === 'number' && status >= 400 && status < 500 ? status : null;
}
