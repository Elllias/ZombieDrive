import { z } from 'zod';

const EnvironmentSchema = z.object({
    DATABASE_URL: z.string().min(1),

    TELEGRAM_BOT_TOKEN: z.preprocess(
        (value) => value === '' ? undefined : value,
        z.string().regex(/^\d+:[A-Za-z0-9_-]+$/).optional(),
    ),

    PORT: z.coerce.number().int().min(1).max(65535).default(3001),
    HOST: z.string().default('127.0.0.1'),
    APP_ORIGIN: z.string().url().default('http://localhost:5173'),
    NODE_ENV: z.enum([ 'development', 'test', 'production' ]).default('development'),
});

export function readEnvironment(values: NodeJS.ProcessEnv = process.env): z.infer<typeof EnvironmentSchema> {
    const environment = EnvironmentSchema.parse(values);
    const origin = new URL(environment.APP_ORIGIN);

    if (![ 'http:', 'https:' ].includes(origin.protocol) || origin.username || origin.password
        || origin.pathname !== '/' || origin.search || origin.hash) {
        throw new Error('APP_ORIGIN must be an HTTP(S) origin without credentials, path, query or fragment');
    }

    if (environment.NODE_ENV === 'production' && origin.protocol !== 'https:') {
        throw new Error('Production APP_ORIGIN must use HTTPS');
    }

    return { ...environment, APP_ORIGIN: origin.origin };
}
