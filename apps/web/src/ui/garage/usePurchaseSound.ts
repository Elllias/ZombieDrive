import { useEffect, useRef } from 'react';

import { AUDIO } from '../../audio/GameAudio';

export function usePurchaseSound(balance: number): void {
    const previous = useRef(balance);

    useEffect(() => {
        if (balance < previous.current) {
            AUDIO.play('purchase', { volume: 0.4 });
        }

        previous.current = balance;
    }, [ balance ]);
}
