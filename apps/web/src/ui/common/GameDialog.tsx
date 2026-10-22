import type { ReactElement, ReactNode } from 'react';

import { useModalDialog } from './useModalDialog';

interface GameDialogProps {
    title: string;
    children: ReactNode;
    onClose: () => void;
    className?: string;
}

export function GameDialog(props: GameDialogProps): ReactElement {
    const element = useModalDialog();

    return (
        <dialog
            ref={element}
            className={`game-dialog metal-panel ${ props.className ?? '' }`}
            aria-label={props.title}
            onClose={props.onClose}
            onCancel={props.onClose}
        >
            <DialogHeading title={props.title} onClose={props.onClose} />
            {props.children}
        </dialog>
    );
}

function DialogHeading(props: Pick<GameDialogProps, 'title' | 'onClose'>): ReactElement {
    return (
        <header className="dialog-heading">
            <h2>{props.title}</h2>

            <button className="game-button close-button" aria-label="Закрыть" onClick={props.onClose}>
                ×
            </button>
        </header>
    );
}
