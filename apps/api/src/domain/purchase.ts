import type { PoolClient } from 'pg';

import { type Purchase, type Progress } from '@zombie-drive/shared';

import { PurchaseRowSchema } from './records';
import { readProgress } from './readProgress';
import { saveUpgrades } from './saveUpgrades';
import { purchaseCost, verifyPurchaseKey } from './purchaseAvailability';

export async function purchase(client: PoolClient, playerId: string, input: Purchase): Promise<Progress> {
    const previous = await client.query('SELECT * FROM purchases WHERE player_id = $1 AND request_key = $2', [
        playerId,
        input.key,
    ]);

    if (previous.rows[0]) {
        const stored = PurchaseRowSchema.parse(previous.rows[0]);

        verifyPurchaseKey(stored, input);

        return readProgress(client, playerId);
    }

    const progress = await readProgress(client, playerId);
    const cost = purchaseCost(progress, input);

    return applyPurchase(client, { playerId, input, cost, progress });
}

async function applyPurchase(
    client: PoolClient,
    context: {
        playerId: string;
        input: Purchase;
        cost: number;
        progress: Progress;
    },
): Promise<Progress> {
    const { playerId, input, cost, progress } = context;
    const upgrades = { ...progress.upgrades, [input.upgrade]: input.expectedLevel + 1 };

    await client.query('UPDATE players SET balance = balance - $2 WHERE id = $1', [ playerId, cost ]);
    await saveUpgrades(client, { playerId, stageId: progress.stageId ?? 'hills', upgrades });

    await client.query(
        'INSERT INTO purchases(player_id, request_key, upgrade, expected_level, cost, stage_id) VALUES($1,$2,$3,$4,$5,$6)',
        [ playerId, input.key, input.upgrade, input.expectedLevel, cost, progress.stageId ],
    );

    return readProgress(client, playerId);
}
