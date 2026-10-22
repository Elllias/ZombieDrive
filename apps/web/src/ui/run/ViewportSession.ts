import type Phaser from 'phaser';

import type { Run } from '@zombie-drive/shared';

import type { GameBridge } from '../../game/GameBridge';

export interface ViewportOptions {
    run: Run;
    bridge: GameBridge;
    onError: (message: string) => void;
}

export class ViewportSession {
    private game: Phaser.Game | null = null;
    private isCancelled = false;
    private readonly observer: ResizeObserver;

    constructor(
        private readonly element: HTMLElement,
        private readonly options: ViewportOptions,
    ) {
        this.observer = new ResizeObserver((): void => {
            this.resize();
        });

        this.observer.observe(element);
        void this.load();
    }

    destroy(): void {
        this.isCancelled = true;
        this.observer.disconnect();
        this.game?.destroy(true);
    }

    private async load(): Promise<void> {
        try {
            const { createGame } = await import('../../game/createGame');

            if (!this.isCancelled) {
                this.game = createGame(
                    this.element, this.options.run, this.options.bridge,
                    (message): void => this.reportError(message),
                );

                this.resize();
            }
        } catch (error: unknown) {
            console.error('Failed to load run', error);
            this.reportError('Не удалось загрузить заезд. Проверь подключение или обнови приложение.');
        }
    }

    private resize(): void {
        this.game?.scale.getParentBounds();
        this.game?.scale.refresh();
    }

    private reportError(message: string): void {
        if (!this.isCancelled) {
            this.options.onError(message);
        }
    }
}
