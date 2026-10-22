import type { RunReport, RunRulesSnapshot } from '@zombie-drive/shared';

export function runReward(report: RunReport, rules: RunRulesSnapshot): number {
    if (report.reason === 'abandon') {
        return 0;
    }

    const kills = report.killedZombieIds.reduce((total, id) => {
        const spawn = rules.spawns.find((candidate) => candidate.id === id);

        return total + rules.killRate * (spawn?.rewardMultiplier ?? 1);
    }, 0);

    return Math.floor(report.distance * rules.distanceRate) + kills;
}
