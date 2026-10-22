import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { extname, join } from 'node:path';

import staticFiles from '@fastify/static';
import type { FastifyInstance, FastifyRequest } from 'fastify';

export async function serveWeb(
    app: FastifyInstance,
    options: { root?: string; required?: boolean } = {},
): Promise<void> {
    const root = options.root ?? fileURLToPath(new URL('../../../dist/web', import.meta.url));

    if (!existsSync(join(root, 'index.html'))) {
        if (options.required) {
            throw new Error('Client build is missing. Run npm run build before starting production.');
        }

        return;
    }

    await app.register(staticFiles, { root });

    app.setNotFoundHandler((request, reply): void => {
        if (isClientNavigation(request)) {
            reply.sendFile('index.html');

            return;
        }

        reply.code(404).send({ message: 'Адрес не найден.' });
    });
}

function isClientNavigation(request: FastifyRequest): boolean {
    const pathname = new URL(request.url, 'http://localhost').pathname;
    const reserved = [ '/api', '/art', '/assets', '/fonts' ];
    const isReserved = reserved.some((prefix) => pathname === prefix || pathname.startsWith(`${ prefix }/`));

    return request.method === 'GET' && request.headers.accept?.includes('text/html') === true
        && !isReserved && extname(pathname) === '';
}
