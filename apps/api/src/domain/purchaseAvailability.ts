import { upgradeCost, upgradeMaxLevel, stageConfig, vehicleConfig } from '@zombie-drive/shared';
import type { Progress, Purchase } from '@zombie-drive/shared';
import type { z } from 'zod';

import type { PurchaseRowSchema } from './records';
import { DomainError } from './errors';

export function verifyPurchaseKey(stored: z.infer<typeof PurchaseRowSchema>, input: Purchase): void {
    if (stored.upgrade !== input.upgrade || stored.expected_level !== input.expectedLevel
        || stored.stage_id !== (input.stageId ?? 'hills')) {
        throw new DomainError(409, 'Ключ покупки уже использован.');
    }
}

export function purchaseCost(progress: Progress, input: Purchase): number {
    const stage = stageConfig(progress.stageId);
    const cost = upgradeCost(input.upgrade, input.expectedLevel, stage.vehicleId);
    const available = vehicleConfig(stage.vehicleId).upgrades.includes(input.upgrade);
    const level = progress.upgrades[input.upgrade] ?? 0;

    if (progress.activeRun || stage.id !== (input.stageId ?? 'hills') || !available
        || level !== input.expectedLevel || input.expectedLevel >= upgradeMaxLevel(input.upgrade)
        || progress.balance < cost) {
        throw new DomainError(409, 'Покупка недоступна. Обновите гараж.');
    }

    return cost;
}
