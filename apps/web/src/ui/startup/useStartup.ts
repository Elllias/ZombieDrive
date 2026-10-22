import { useEffect, useReducer, useState } from 'react';

import { initializeTelegram } from '../../platform/telegram';

type StartupStatus = 'loading' | 'ready' | 'error';

export function useStartup(): { status: StartupStatus; retry: () => void } {
    const [ status, setStatus ] = useState<StartupStatus>('loading');
    const [ attempt, retry ] = useReducer((current: number): number => current + 1, 0);

    useEffect(() => loadStartup(setStatus), [ attempt ]);

    return { status, retry };
}

function loadStartup(update: (status: StartupStatus) => void): () => void {
    let isCurrent = true;

    update('loading');

    void initializeTelegram().then((): void => {
        if (isCurrent) {
            update('ready');
        }
    }).catch((error: unknown): void => {
        console.error('Failed to initialize Telegram', error);

        if (isCurrent) {
            update('error');
        }
    });

    return (): void => {
        isCurrent = false;
    };
}
