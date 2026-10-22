import { useEffect } from 'react';

import { bindLandscapeOrientation } from '../../platform/bindLandscapeOrientation';

import type { GameBridge } from '../../game/GameBridge';

import type { InputController } from './InputController';
import { bindRunKeyboard } from './runKeyboard';

export function useRunLifecycle(bridge: GameBridge, input: InputController): void {
    useEffect(() => {
        const cleanupKeyboard = bindRunKeyboard(input, bridge);
        const cleanupPlatform = bindPlatform(bridge, input);

        return (): void => {
            cleanupKeyboard();
            cleanupPlatform();
            input.clear();
        };
    }, [ bridge, input ]);
}

function bindPlatform(bridge: GameBridge, input: InputController): () => void {
    const pause = (): void => {
        input.clear();
        bridge.pause();
    };

    const visibility = (): void => {
        if (document.hidden) {
            pause();
        }
    };

    const orientation = (): void => pauseInPortrait(pause);
    const cleanupTelegram = bindTelegram(pause);
    const cleanupOrientation = bindLandscapeOrientation();

    window.addEventListener('blur', pause);
    window.addEventListener('resize', orientation);
    document.addEventListener('visibilitychange', visibility);
    orientation();

    return (): void => {
        window.removeEventListener('blur', pause);
        window.removeEventListener('resize', orientation);
        document.removeEventListener('visibilitychange', visibility);
        cleanupTelegram();
        cleanupOrientation();
    };
}

function pauseInPortrait(pause: () => void): void {
    if (window.innerHeight > window.innerWidth) {
        pause();
    }
}

function bindTelegram(pause: () => void): () => void {
    const app = window.Telegram?.WebApp;

    const activity = (): void => {
        if (app?.isActive === false) {
            pause();
        }
    };

    if (app?.isVersionAtLeast('6.1')) {
        app.BackButton.show();
        app.BackButton.onClick(pause);
    }

    app?.onEvent('activated', activity);
    app?.onEvent('deactivated', pause);

    return (): void => {
        if (app?.isVersionAtLeast('6.1')) {
            app.BackButton.offClick(pause);
            app.BackButton.hide();
        }

        app?.offEvent('activated', activity);
        app?.offEvent('deactivated', pause);
    };
}
