import { type RunReport } from '@zombie-drive/shared';

import type { RunRow } from './records';
import { DomainError } from './errors';

export function validateReport(report: RunReport, run: RunRow): void {
    const settings = run.rules;
    const elapsedWall = (Date.now() - run.started_at.getTime()) / 1000;

    const invalidTime = report.elapsedSeconds > elapsedWall + 2
        || report.elapsedSeconds > settings.activeLimitSeconds + 1;

    const invalidDistance = report.distance > settings.maximumDistance
        || report.distance > report.elapsedSeconds * settings.maximumSpeed + 5;

    const invalidIds = hasUnreachableKills(report, run);
    const hasDuplicates = new Set(report.killedZombieIds).size !== report.killedZombieIds.length;

    const invalidFinish = report.reason !== 'abandon'
        && (report.reason === 'finish') !== (report.distance >= settings.maximumDistance);

    if (invalidTime || invalidDistance || invalidIds || hasDuplicates || invalidFinish) {
        throw new DomainError(422, 'Отчёт заезда не прошёл проверку.');
    }
}

function hasUnreachableKills(report: RunReport, run: RunRow): boolean {
    const settings = run.rules;

    const reachableX = report.distance
        + settings.startX
        + settings.zombieSpeed * report.elapsedSeconds
        + settings.activationMargin;

    return report.killedZombieIds.some(
        (id) => !settings.spawns.some((spawn) => spawn.id === id && spawn.x <= reachableX),
    );
}
