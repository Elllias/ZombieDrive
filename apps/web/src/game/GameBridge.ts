import type { RunReport } from '@zombie-drive/shared';

import type { Controls } from './physics/types';

export interface GameSnapshot {
    distance: number;
    speed: number;
    fuelRatio: number;
    kills: number;
    elapsed: number;
    report: RunReport | null;
    isPaused: boolean;
}

export class GameBridge {
    controls: Controls = { gas: false, brake: false, tilt: 0 };
    private listeners = new Set<() => void>();
    private canResume = true;

    private snapshot: GameSnapshot = {
        distance: 0,
        speed: 0,
        fuelRatio: 1,
        kills: 0,
        elapsed: 0,
        report: null,
        isPaused: false,
    };

    getSnapshot = (): GameSnapshot => this.snapshot;

    subscribe = (listener: () => void): (() => void) => {
        this.listeners.add(listener);

        return (): void => {
            this.listeners.delete(listener);
        };
    };

    publish(snapshot: GameSnapshot): void {
        this.snapshot = snapshot;
        this.listeners.forEach((listener): void => listener());
    }

    pause(): void {
        this.controls = { gas: false, brake: false, tilt: 0 };
        this.publish({ ...this.snapshot, isPaused: true });
    }

    resume(): void {
        if (!this.canResume) {
            return;
        }

        this.publish({ ...this.snapshot, isPaused: false });
    }

    pauseForError(): void {
        this.canResume = false;
        this.pause();
    }

    abandon(): void {
        this.publish({
            ...this.snapshot,

            report: {
                distance: this.snapshot.distance,
                elapsedSeconds: this.snapshot.elapsed,
                killedZombieIds: [],
                reason: 'abandon',
            },
        });
    }
}
