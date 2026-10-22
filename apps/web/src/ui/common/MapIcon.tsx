import type { ReactElement } from 'react';

export function MapIcon(): ReactElement {
    return (
        <svg
            className="map-icon"
            viewBox="0 0 32 32"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinejoin="round"
        >
            <path d="m3 7 8-3 10 4 8-3v22l-8 3-10-4-8 3Zm8-3v22M21 8v22" />
            <path d="m14 13 4 8m0-8-4 8" stroke="#e28a26" />
        </svg>
    );
}
