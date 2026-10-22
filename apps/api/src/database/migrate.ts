import { readFile } from 'node:fs/promises';

import type { Pool, PoolClient } from 'pg';
import { z } from 'zod';

import { rulesSnapshot } from '@zombie-drive/shared';

import { transaction } from './transaction';

export async function migrate(pool: Pool): Promise<void> {
    await transaction(pool, applyMigrations);
}

async function applyMigrations(client: PoolClient): Promise<void> {
    await client.query('SELECT pg_advisory_xact_lock(845307112)');
    await lockExistingPlayers(client);

    await applySql(client, '001_initial.sql');
    await client.query('ALTER TABLE runs ADD COLUMN IF NOT EXISTS rules jsonb');
    await client.query('UPDATE runs SET rules = $1 WHERE rules IS NULL', [ rulesSnapshot() ]);
    await client.query('ALTER TABLE runs ALTER COLUMN rules SET NOT NULL');

    for (const name of [ '002_stages.sql', '003_single_plow.sql', '004_mountain_pass.sql', '005_telegram_accounts.sql' ]) {
        await applySql(client, name);
    }
}

async function applySql(client: PoolClient, name: string): Promise<void> {
    const sql = await readFile(new URL(`../../migrations/${ name }`, import.meta.url), 'utf8');

    await client.query(sql);
}

async function lockExistingPlayers(client: PoolClient): Promise<void> {
    const result = await client.query("SELECT to_regclass('players') IS NOT NULL AS exists");
    const row = z.object({ exists: z.boolean() }).parse(result.rows[0]);

    // Even CREATE INDEX IF NOT EXISTS locks runs. Match API lock order before running the initial SQL.
    if (row.exists) {
        await client.query('LOCK TABLE players IN ACCESS EXCLUSIVE MODE');
    }
}
