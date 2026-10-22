import { z } from 'zod';

import {
    ProgressSchema,
    RunSchema,
    SettlementSchema,
    type RunReport,
    type Purchase,
    type StageId,
} from '@zombie-drive/shared';

import { telegramSessionInput } from '../platform/telegramSessionInput';

import { request } from './request';

export const API = {
    session: () => request('/session', z.object({ ready: z.boolean() }), telegramSessionInput()),
    progress: () => request('/progress', ProgressSchema),
    start: (key: string) => request('/runs', RunSchema, { key }),
    finish: (id: string, report: RunReport) => request(`/runs/${ id }/finish`, SettlementSchema, report),
    selectStage: (stageId: StageId) => request('/stages/select', ProgressSchema, { stageId }),
    purchase: (input: Purchase) => request('/purchases', ProgressSchema, input),
};
