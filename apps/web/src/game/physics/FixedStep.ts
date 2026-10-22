import { GAME_CONFIG } from '@zombie-drive/shared';

export class FixedStep {
    private accumulator = 0;

    advance(deltaMilliseconds: number, step: () => void): number {
        const settings = GAME_CONFIG.world;

        this.accumulator += Math.min(deltaMilliseconds, GAME_CONFIG.rendering.maxFrameMilliseconds) / 1000;

        let steps = 0;

        while (this.accumulator >= settings.stepSeconds && steps < settings.maxSteps) {
            step();
            this.accumulator -= settings.stepSeconds;
            steps += 1;
        }

        if (steps === settings.maxSteps) {
            this.accumulator %= settings.stepSeconds;
        }

        return this.accumulator / settings.stepSeconds;
    }

    reset(): void {
        this.accumulator = 0;
    }
}
