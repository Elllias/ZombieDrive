import { useEffect, useRef } from 'react';

export function usePauseOnLeave(pause: () => void): void {
    const callback = useRef(pause);

    callback.current = pause;

    useEffect(() => {
        const stop = (): void => callback.current();

        const visibility = (): void => {
            if (document.hidden) {
                stop();
            }
        };

        const app = window.Telegram?.WebApp;

        window.addEventListener('blur', stop);
        document.addEventListener('visibilitychange', visibility);
        app?.onEvent('deactivated', stop);

        return (): void => {
            window.removeEventListener('blur', stop);
            document.removeEventListener('visibilitychange', visibility);
            app?.offEvent('deactivated', stop);
        };
    }, []);
}
