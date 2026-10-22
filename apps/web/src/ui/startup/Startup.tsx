import type { ReactElement } from 'react';

import { Experience } from '../Experience';

import { useStartup } from './useStartup';

export function Startup(): ReactElement {
    const { status, retry } = useStartup();

    if (status === 'ready') {
        return <Experience />;
    }

    return <StartupStatus isError={status === 'error'} onRetry={retry} />;
}

function StartupStatus(props: { isError: boolean; onRetry: () => void }): ReactElement {
    return (
        <main className="status-screen">
            <span className="brand-mark">ZD</span>

            <p role={props.isError ? 'alert' : 'status'}>
                {props.isError
                    ? 'Не удалось подключиться к Telegram. Проверь подключение и попробуй ещё раз.'
                    : 'Подключаемся к Telegram…'}
            </p>

            {props.isError && <button className="primary" onClick={props.onRetry}>Повторить</button>}
        </main>
    );
}
