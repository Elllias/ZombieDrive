import { useEffect, useRef, useState } from 'react';

import { usePauseOnLeave } from './usePauseOnLeave';

interface PlaybackOptions {
    duration: number;
    onFinish: () => void;
    autoPlay?: boolean;
}

export function useCutscenePlayback({ duration, onFinish, autoPlay = false }: PlaybackOptions): {
    elapsed: number; isPlaying: boolean; isPaused: boolean; start: () => void; resume: () => void;
} {
    const [ elapsed, setElapsed ] = useState(0);
    const [ isPlaying, setPlaying ] = useState(autoPlay);
    const [ isPaused, setPaused ] = useState(false);
    const clock = useRef(0);
    const finish = useRef(onFinish);

    finish.current = onFinish;
    usePauseOnLeave(() => setPaused(true));

    useEffect(() => {
        if (!isPlaying || isPaused) {
            return;
        }

        return animateCutscene({ clock, duration, publish: setElapsed, finish: () => finish.current() });
    }, [ isPlaying, isPaused, duration ]);

    return { elapsed,
        isPlaying,
        isPaused,

        start: () => {
            setPaused(false);
            setPlaying(true);
        },

        resume: () => setPaused(false) };
}

function animateCutscene(options: {
    clock: { current: number }; duration: number; publish: (elapsed: number) => void; finish: () => void;
}): () => void {
    let previous = performance.now();
    let frame = 0;

    const step = (now: number): void => {
        options.clock.current += Math.min(100, Math.max(0, now - previous));
        previous = now;
        options.publish(options.clock.current);

        if (options.clock.current >= options.duration) {
            options.finish();
        } else {
            frame = requestAnimationFrame(step);
        }
    };

    frame = requestAnimationFrame(step);

    return (): void => cancelAnimationFrame(frame);
}
