import type { Run } from '@zombie-drive/shared';

import type { RunRow } from './records';

export function toRun(row: RunRow): Run {
    return {
        id: row.id,
        stageId: row.stage_id,
        configurationVersion: row.configuration_version,
        stats: row.stats,
        expiresAt: row.expires_at.toISOString(),
    };
}
