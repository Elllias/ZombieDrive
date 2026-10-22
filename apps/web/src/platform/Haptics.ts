import { HAPTIC_INTERVAL_MILLISECONDS, type HapticStyle } from '../configs/haptics';

import { PREFERENCES } from './preferences';

class Haptics {
    private isDisabled = PREFERENCES.read('haptics-disabled');
    private lastImpactAt = -Infinity;
    private readonly listeners = new Set<() => void>();

    getDisabled = (): boolean => this.isDisabled;

    subscribe = (listener: () => void): (() => void) => {
        this.listeners.add(listener);

        return (): void => {
            this.listeners.delete(listener);
        };
    };

    isAvailable(): boolean {
        return typeof window !== 'undefined'
            && Boolean(window.Telegram?.WebApp?.isVersionAtLeast('6.1') && window.Telegram.WebApp.HapticFeedback);
    }

    toggle(): void {
        this.isDisabled = !this.isDisabled;
        PREFERENCES.write('haptics-disabled', this.isDisabled);
        this.listeners.forEach((listener): void => listener());
    }

    impact(style: HapticStyle): void {
        const now = performance.now();

        if (now - this.lastImpactAt < HAPTIC_INTERVAL_MILLISECONDS) {
            return;
        }

        this.send((): void => {
            window.Telegram?.WebApp?.HapticFeedback?.impactOccurred(style);
            this.lastImpactAt = now;
        });
    }

    success(): void {
        this.send((): void => window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success'));
    }

    private send(action: () => void): void {
        if (this.isDisabled || !this.isAvailable() || document.hidden || window.Telegram?.WebApp?.isActive === false) {
            return;
        }

        try {
            action();
        } catch {
            // Unsupported native feedback must not interrupt gameplay or result delivery.
        }
    }
}

export const HAPTICS = new Haptics();
