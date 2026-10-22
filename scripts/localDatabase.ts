import { existsSync } from 'node:fs';

import EmbeddedPostgres from 'embedded-postgres';

interface DatabaseOptions {
    directory: string;
    port: number;
    persistent: boolean;
}

export async function localDatabase(
    options: DatabaseOptions,
): Promise<{ url: string; stop: () => Promise<void> }> {
    const database = createDatabase(options);

    if (!existsSync(`${ options.directory }/PG_VERSION`)) {
        await database.initialise();
    }

    await database.start();

    return {
        url: `postgresql://zombie:local-development@127.0.0.1:${ options.port }/postgres`,
        stop: (): Promise<void> => database.stop(),
    };
}

function createDatabase(options: DatabaseOptions): EmbeddedPostgres {
    return new EmbeddedPostgres({
        databaseDir: options.directory,
        user: 'zombie',
        password: 'local-development',
        port: options.port,
        persistent: options.persistent,
        createPostgresUser: false,
        postgresFlags: [ '-h', '127.0.0.1' ],

        onLog: (): void => {
            /* Native PostgreSQL startup output is omitted from the game log. */
        },

        onError: (error: unknown): void => {
            console.error(error);
        },
    });
}
