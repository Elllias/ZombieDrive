import { z } from 'zod';

import { CarStatsSchema, UpgradesSchema, RunRulesSchema, StageSchema } from '@zombie-drive/shared';

export const PlayerRowSchema = z.object({
    id: z.string().uuid(),
    selected_stage: StageSchema.default('hills'),
    completed_hills: z.boolean().default(false),
    balance: z.number().int(),
    best_distance: z.number(),
    upgrades: UpgradesSchema,
});

export const RunRowSchema = z.object({
    id: z.string().uuid(),
    stage_id: StageSchema.default('hills'),
    configuration_version: z.string(),
    stats: CarStatsSchema,
    expires_at: z.date(),
    started_at: z.date(),
    state: z.enum([ 'active', 'finished', 'abandoned' ]),
    reward: z.number().int().nullable(),
    rules: RunRulesSchema,
});

export type RunRow = z.infer<typeof RunRowSchema>;

export const PurchaseRowSchema = z.object({
    upgrade: z.string(), expected_level: z.number().int(), stage_id: StageSchema.default('hills'),
});

export const StageRowSchema = z.object({
    stage_id: StageSchema, best_distance: z.number(), completed: z.boolean(), upgrades: UpgradesSchema,
});
