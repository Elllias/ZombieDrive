import type { RunReport } from '@zombie-drive/shared';

import { GameBridge } from '../../game/GameBridge';

export function createBridge(report?: RunReport, showInstructions = false): GameBridge {
    const bridge = new GameBridge();

    if (report) {
        bridge.publish({
            distance: report.distance,
            elapsed: report.elapsedSeconds,
            speed: 0,
            fuelRatio: 0,
            kills: report.killedZombieIds.length,
            report,
            isPaused: false,
        });
    } else if (showInstructions) {
        bridge.pause();
    }

    return bridge;
}
