import Phaser from 'phaser';

import { GAME_CONFIG, type Run } from '@zombie-drive/shared';

import { RunScene } from './RunScene';
import { GameSimulation } from './GameSimulation';
import type { GameBridge } from './GameBridge';

export function createGame(
    parent: HTMLElement,
    run: Run,
    bridge: GameBridge,
    onError: (message: string) => void,
): Phaser.Game {
    const settings = GAME_CONFIG.rendering;
    const simulation = new GameSimulation(run.stats, { stageId: run.stageId });

    return new Phaser.Game({
        type: Phaser.AUTO,
        parent,
        width: settings.width,
        height: settings.height,
        backgroundColor: '#202e37',
        scale: { mode: Phaser.Scale.RESIZE },
        scene: new RunScene(bridge, simulation, onError),
        render: { antialias: true },
        audio: { noAudio: true },
        input: { keyboard: false, mouse: false, touch: false },
    });
}
