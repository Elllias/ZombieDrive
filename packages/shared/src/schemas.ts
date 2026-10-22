import { z } from 'zod';

import { STAGE_IDS, VEHICLE_IDS } from './identifiers';

export const StageSchema = z.enum(STAGE_IDS);
export type StageId = z.infer<typeof StageSchema>;
const VehicleSchema = z.enum(VEHICLE_IDS);

export type VehicleId = z.infer<typeof VehicleSchema>;

const UpgradeSchema = z.enum([ 'engine', 'tank', 'tires', 'suspension', 'plow' ]);

export type Upgrade = z.infer<typeof UpgradeSchema>;

export const UpgradesSchema = z.object({
    engine: z.number().int().min(0).max(5),
    tank: z.number().int().min(0).max(5),
    tires: z.number().int().min(0).max(5),
    suspension: z.number().int().min(0).max(5),
    plow: z.number().int().min(0).max(1).optional(),
});

export type Upgrades = z.infer<typeof UpgradesSchema>;

export const CarStatsSchema = z.object({
    vehicleId: VehicleSchema.optional(),
    // Preserve run snapshots created before the plow became a one-time purchase.
    plowLevel: z.number().int().min(0).max(5).optional(),
    driveTorque: z.number().positive(),
    friction: z.number().positive(),
    springFrequency: z.number().positive(),
    springDamping: z.number().positive(),
    fuelSeconds: z.number().positive(),
    wheelRadius: z.number().positive().default(0.5),
    axleHeight: z.number().positive().default(0.7),
    tireLevel: z.number().int().min(0).max(5).default(0),
});

export type CarStats = z.infer<typeof CarStatsSchema>;

const ReasonSchema = z.enum([ 'finish', 'fuel', 'rollover', 'stuck', 'timeout', 'abandon' ]);

export const ReportSchema = z
    .object({
        distance: z.number().finite().min(0),
        elapsedSeconds: z.number().finite().min(0),
        killedZombieIds: z.array(z.string()).max(100),
        reason: ReasonSchema,
    })
    .strict();

export type RunReport = z.infer<typeof ReportSchema>;

export const RunSchema = z.object({
    stageId: StageSchema.optional(),
    id: z.string().uuid(),
    configurationVersion: z.string(),
    stats: CarStatsSchema,
    expiresAt: z.string().datetime(),
});

export type Run = z.infer<typeof RunSchema>;

const StageProgressSchema = z.object({
    stageId: StageSchema, bestDistance: z.number().min(0), completed: z.boolean(),
});

export const ProgressSchema = z.object({
    stageId: StageSchema.optional(),
    stages: z.array(StageProgressSchema).optional(),
    balance: z.number().int().min(0),
    bestDistance: z.number().min(0),
    upgrades: UpgradesSchema,
    activeRun: RunSchema.nullable(),
});

export type Progress = z.infer<typeof ProgressSchema>;

export const SettlementSchema = z.object({ reward: z.number().int().min(0), progress: ProgressSchema });

export type Settlement = z.infer<typeof SettlementSchema>;

export const StartSchema = z.object({ key: z.string().uuid() }).strict();

export const PurchaseSchema = z
    .object({
        key: z.string().uuid(),
        stageId: StageSchema.optional(),
        upgrade: UpgradeSchema,
        expectedLevel: z.number().int().min(0).max(4),
    })
    .strict();

export const SelectStageSchema = z.object({ stageId: StageSchema }).strict();

export type Purchase = z.infer<typeof PurchaseSchema>;

export const PendingResultSchema = z.object({ run: RunSchema, report: ReportSchema });

export const ErrorSchema = z.object({ message: z.string() });

export const RunRulesSchema = z.object({
    distanceRate: z.number().positive(),
    killRate: z.number().positive(),
    maximumDistance: z.number().positive(),
    maximumSpeed: z.number().positive(),
    activeLimitSeconds: z.number().positive(),
    startX: z.number(),
    zombieSpeed: z.number().positive(),
    activationMargin: z.number().positive(),
    spawns: z.array(z.object({ id: z.string(), x: z.number(), rewardMultiplier: z.number().positive().optional() })),
});

export type RunRulesSnapshot = z.infer<typeof RunRulesSchema>;
