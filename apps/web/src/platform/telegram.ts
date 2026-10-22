import type { HapticStyle } from '../configs/haptics';

import { loadTelegramSdk } from './loadTelegramSdk';

interface TelegramWebApp {
    initData?: string;
    isOrientationLocked?: boolean;

    HapticFeedback?: {
        impactOccurred: (style: HapticStyle) => void;
        notificationOccurred: (type: 'success' | 'warning' | 'error') => void;
    };

    lockOrientation?: () => void;
    unlockOrientation?: () => void;
    ready: () => void;
    expand: () => void;
    setHeaderColor: (color: string) => void;
    setBackgroundColor: (color: string) => void;
    disableVerticalSwipes?: () => void;
    isVersionAtLeast: (version: string) => boolean;

    BackButton: {
        show: () => void;
        hide: () => void;
        onClick: (listener: () => void) => void;
        offClick: (listener: () => void) => void;
    };

    onEvent: (event: string, listener: () => void) => void;
    offEvent: (event: string, listener: () => void) => void;
    isActive?: boolean;
}

declare global {
    interface Window {
        Telegram?: { WebApp?: TelegramWebApp };
    }
}

export async function initializeTelegram(): Promise<void> {
    await loadTelegramSdk();

    const app = window.Telegram?.WebApp;

    app?.ready();
    app?.expand();

    if (app?.isVersionAtLeast('6.1')) {
        app.setHeaderColor('#171c20');
        app.setBackgroundColor('#171c20');
    }

    if (app?.isVersionAtLeast('7.7')) {
        app.disableVerticalSwipes?.();
    }
}
