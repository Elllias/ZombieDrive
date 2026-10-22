import { useEffect } from 'react';

import { AUDIO } from './GameAudio';

export function useAudioLifecycle(): void {
    useEffect(() => bindAudio(), []);
}

function bindAudio(): () => void {
    const app = window.Telegram?.WebApp;

    const bindings: Array<[EventTarget, string, EventListener, boolean]> = [
        [ document, 'pointerdown', unlock, true ],
        [ document, 'keydown', unlock, true ],
        [ document, 'click', playButton, false ],
        [ document, 'visibilitychange', visibility, false ],
        [ window, 'blur', deactivate, false ],
    ];

    bindings.forEach(([ target, name, listener, capture ]) => target.addEventListener(name, listener, capture));
    app?.onEvent('deactivated', deactivate);

    return (): void => {
        bindings.forEach(([ target, name, listener, capture ]) => target.removeEventListener(name, listener, capture));
        app?.offEvent('deactivated', deactivate);
        deactivate();
    };
}

function unlock(): void {
    AUDIO.unlock();
}

function deactivate(): void {
    AUDIO.deactivate();
}

function visibility(): void {
    if (document.hidden) {
        deactivate();
    }
}

function playButton(event: Event): void {
    if (!(event.target instanceof Element)) {
        return;
    }

    const button = event.target.closest('button');

    if (button && !button.disabled && !button.closest('.run-controls, [data-audio="silent"]')) {
        AUDIO.play('click', { volume: 0.25 });
    }
}
