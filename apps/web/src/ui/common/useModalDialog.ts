import { useEffect, useRef, type RefObject } from 'react';

export function useModalDialog(): RefObject<HTMLDialogElement | null> {
    const element = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        element.current?.showModal();
    }, []);

    return element;
}
