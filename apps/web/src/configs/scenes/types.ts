export type IntroCue = 'radio' | 'starter' | 'engine' | 'stall' | 'music';

export interface IntroShot {
    start: number;
    scene: 'radio' | 'map' | 'garage';
    cue: IntroCue;
    label: string;
    text: string;
}

export type EndingPhase = 'approach' | 'radio' | 'gate' | 'departure' | 'safe';

export interface EndingShot {
    start: number;
    phase: EndingPhase;
    label: string;
    text: string;
}
