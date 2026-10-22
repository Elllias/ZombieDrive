import { STAGE_IDS, stageConfig } from '@zombie-drive/shared';

import type { SoundId } from '../audio';

import type { EndingShot } from './types';

export const ENDING_DURATION = 16000;
export const ENDING_GATE_OPEN = 7200;
export const ENDING_DEPARTURE = 9200;
export const ENDING_ARRIVAL = 13300;
export const ENDING_STOP = 4200;

export const ENDING_VEHICLE = {
    vehicleId: stageConfig(STAGE_IDS.at(-1) ?? STAGE_IDS[0]).vehicleId,
    tireLevel: 5,
    plowLevel: 1,
};

export const ENDING_FIRST_SHOT: EndingShot = {
    start: 0, phase: 'approach', label: 'За перевалом', text: 'Огни. Здесь ещё кто-то есть.',
};

export const ENDING_SHOTS: ReadonlyArray<EndingShot> = [
    ENDING_FIRST_SHOT,

    { start: ENDING_STOP,
        phase: 'radio',
        label: '104.8 FM · связь восстановлена',
        text: 'Пост эвакуации, приём. Я прошёл перевал.' },

    { start: ENDING_GATE_OPEN,
        phase: 'gate',
        label: 'Сигнал принят',
        text: 'Вижу тебя. Открываю ворота. Проезжай!' },

    { start: ENDING_DEPARTURE,
        phase: 'departure',
        label: 'Последние метры',
        text: 'За воротами безопасно.' },

    { start: ENDING_ARRIVAL,
        phase: 'safe',
        label: 'Эвакуационный пункт',
        text: 'Три дороги позади.' },
];

export const ENDING_MOTION = {
    carStart: -32,
    approachTravel: 62,
    departureTravel: 93,
    wheelDegreesPerPercent: 23,
    gateAngle: 85,
    gateOpenDuration: 1700,
    gateCloseDuration: 1600,
    lightFadeDuration: 2000,
    initialLight: 0.08,
    addedLight: 0.22,
};

export const ENDING_COPY = {
    title: 'Сигнал принят',
    chapter: 'Последний рубеж',
    subtitle: 'Финал истории',

    victory: {
        label: 'Ты выбрался',
        title: 'ТЫ ВЫБРАЛСЯ',
        stamp: 'Сигнал принят · 104.8 FM',
        description: 'Холмы. Завод. Перевал. Всё позади.',
        thanks: 'Спасибо, что доехал.',
    },
};

export const ENDING_ART = {
    backdrop: '/art/evacuation.webp',
    barrierArm: { src: '/art/ending-barrier-arm.webp', width: 566, height: 65 },
    barrierPost: { src: '/art/ending-barrier-post.webp', width: 196, height: 376 },
};

export const ENDING_SOUNDS: ReadonlyArray<SoundId> = [
    'engineR8', 'wind', 'radio', 'metal', 'purchase', 'menuMusic',
];
