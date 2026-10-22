import { Pool } from 'pg';

import { readEnvironment } from './environment';
import { migrate } from './database/migrate';
import { createApp } from './createApp';
import { serveWeb } from './serveWeb';

const environment = readEnvironment();

const pool = new Pool({ connectionString: environment.DATABASE_URL, max: 10, connectionTimeoutMillis: 5000 });

const app = await createApp({
    pool, origin: environment.APP_ORIGIN, logger: true, telegramBotToken: environment.TELEGRAM_BOT_TOKEN,
});

app.addHook('onClose', async (): Promise<void> => {
    await pool.end();
});

pool.on('error', (error): void => {
    app.log.error({ err: error }, 'Idle PostgreSQL connection failed');
});

for (const signal of [ 'SIGINT', 'SIGTERM' ]) {
    process.once(signal, (): void => {
        void app.close();
    });
}

try {
    await migrate(pool);
    await serveWeb(app, { required: environment.NODE_ENV === 'production' });
    await app.listen({ port: environment.PORT, host: environment.HOST });
} catch (error: unknown) {
    await app.close();

    throw error;
}
