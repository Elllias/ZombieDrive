import type { ReactElement } from 'react';

export function TiltIcon({ direction }: { direction: 'tiltLeft' | 'tiltRight' }): ReactElement {
    return (
        <svg className="tilt-icon" viewBox="0 0 48 48" aria-hidden="true">
            <g transform={direction === 'tiltRight' ? 'translate(48 0) scale(-1 1)' : undefined}>
                <path d="M11 21C10 9 34 7 37 22C39 34 25 42 16 33M5 15 11 23 19 17" />
            </g>
        </svg>
    );
}
