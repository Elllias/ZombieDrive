import { useEffect, useRef, type ReactElement } from 'react';

import { ViewportSession, type ViewportOptions } from './ViewportSession';

export function GameViewport(props: ViewportOptions): ReactElement {
    const element = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!element.current) {
            return;
        }

        const session = new ViewportSession(element.current, props);

        return (): void => {
            session.destroy();
        };
    }, [ props.run, props.bridge, props.onError ]);

    return <div ref={element} className="game-viewport" aria-label="Автомобильная трасса с зомби" />;
}
