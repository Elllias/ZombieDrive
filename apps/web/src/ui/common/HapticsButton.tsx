import { useSyncExternalStore, type ReactElement } from 'react';

import { HAPTICS } from '../../platform/Haptics';

export function HapticsButton(): ReactElement | null {
    const isDisabled = useSyncExternalStore(HAPTICS.subscribe, HAPTICS.getDisabled);

    if (!HAPTICS.isAvailable()) {
        return null;
    }

    return (
        <button className="game-button sound-button" aria-pressed={!isDisabled}
            aria-label={isDisabled ? 'Включить вибрацию' : 'Выключить вибрацию'} onClick={() => HAPTICS.toggle()}>
            Вибрация: {isDisabled ? 'выкл' : 'вкл'}
        </button>
    );
}
