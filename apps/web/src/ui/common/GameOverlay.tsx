import type { ReactElement, ReactNode } from 'react';

import { useModalDialog } from './useModalDialog';

export function GameOverlay(props: { title: string; children: ReactNode; className?: string }): ReactElement {
    const element = useModalDialog();

    return (
        <dialog ref={element} className={`game-overlay ${ props.className ?? '' }`} aria-label={props.title}
            onCancel={(event) => event.preventDefault()}>
            {props.children}
        </dialog>
    );
}
