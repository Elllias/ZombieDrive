import type { ReactElement } from 'react';

export function LockIcon(): ReactElement {
    return (
        <svg className="tier-lock" viewBox="0 0 64 80" aria-hidden="true">
            <path
                d="M13 37V20C13 0 51 0 51 20V37H41V20C41 12 23 12 23 20V37Z"
                fill="#bbae83"
                stroke="#292417"
                strokeWidth="4"
            />

            <path d="M6 31H58L61 64 53 75H11L3 64Z" fill="#8c8668" stroke="#292417" strokeWidth="4" />
            <path d="M10 36H54L56 60" fill="none" stroke="#d0c49b" strokeWidth="3" />

            <path
                d="M38 50A6 6 0 1 0 26 50Q26 54 29 55L26 66H38L35 55Q38 54 38 50Z"
                fill="#24241a"
                stroke="#cfbd87"
                strokeWidth="2"
            />

            <circle cx="12" cy="44" r="3" fill="#d0c49b" />
            <circle cx="52" cy="44" r="3" fill="#d0c49b" />
        </svg>
    );
}
