const SDK_URL = 'https://telegram.org/js/telegram-web-app.js?64';

const SDK_TIMEOUT_MILLISECONDS = 15000;

let loading: Promise<void> | null = null;

export function loadTelegramSdk(): Promise<void> {
    if (window.Telegram?.WebApp) {
        return Promise.resolve();
    }

    loading ??= requestSdk().catch((error: unknown): never => {
        loading = null;

        throw error;
    });

    return loading;
}

function requestSdk(): Promise<void> {
    const script = document.createElement('script');
    const controller = new AbortController();

    script.id = 'telegram-sdk';
    script.src = SDK_URL;
    script.async = true;

    return waitForSdk(script, controller.signal)
        .finally((): void => controller.abort())
        .catch((error: unknown): never => {
            script.remove();

            throw error;
        });
}

function waitForSdk(script: HTMLScriptElement, signal: AbortSignal): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(
            (): void => reject(new Error('Telegram SDK loading timed out')),
            SDK_TIMEOUT_MILLISECONDS,
        );

        signal.addEventListener('abort', (): void => clearTimeout(timeout), { once: true });

        script.addEventListener('load', (): void => {
            if (!window.Telegram?.WebApp) {
                reject(new Error('Telegram SDK did not initialize'));

                return;
            }

            resolve();
        }, { once: true, signal });

        script.addEventListener('error', (): void => reject(new Error('Telegram SDK loading failed')),
            { once: true, signal });

        document.head.append(script);
    });
}
