import type { ReactElement } from 'react';

import { GAME_CONFIG } from '@zombie-drive/shared';

export function LevelTrack({ level, maximum = GAME_CONFIG.economy.maxLevel }: {
    level: number;
    maximum?: number;
}): ReactElement {
    const label = maximum === 1
        ? level > 0
            ? 'Установлено'
            : 'Не установлено'
        : `Уровень ${ level } из ${ maximum }`;

    return (
        <span className="level-track" aria-label={label}>
            {Array.from({ length: maximum }, (_, index) => (
                <span key={index} className={index < level ? 'filled' : ''} />
            ))}
        </span>
    );
}
