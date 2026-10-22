import type { SoundId } from '../audio';

import type { IntroShot } from './types';

export const INTRO_DURATION = 14500;
export const INTRO_PREFERENCE = 'intro-seen-v2';

export const INTRO_FIRST_SHOT: IntroShot = {
    start: 0,
    scene: 'radio',
    cue: 'radio',
    label: 'Частота 104.8 · последний сигнал',
    text: '…кто ещё слышит…',
};

export const INTRO_SHOTS: ReadonlyArray<IntroShot> = [
    INTRO_FIRST_SHOT,

    { start: 1800,
        scene: 'radio',
        cue: 'radio',
        label: 'Частота 104.8 · последний сигнал',
        text: 'Эвакуация за перевалом.' },

    { start: 3500,
        scene: 'map',
        cue: 'radio',
        label: 'Маршрут эвакуации',
        text: 'Дорога через старый завод.' },

    { start: 6500,
        scene: 'map',
        cue: 'radio',
        label: 'Сигнал потерян',
        text: 'Повторяю… за перевалом…' },

    { start: 8200,
        scene: 'garage',
        cue: 'starter',
        label: 'Последний шанс',
        text: 'Пока машина едет — шанс есть.' },

    { start: 9800,
        scene: 'garage',
        cue: 'engine',
        label: 'Последний шанс',
        text: 'Пока машина едет — шанс есть.' },

    { start: 10800,
        scene: 'garage',
        cue: 'stall',
        label: 'Мотор заглох',
        text: 'Придётся повозиться.' },

    { start: 12500,
        scene: 'garage',
        cue: 'music',
        label: 'Гараж',
        text: 'Пора готовиться к дороге.' },
];

export const INTRO_COPY = {
    title: 'Последний сигнал',
    kicker: 'Эфир ещё не замолчал',
    tagline: 'Одна машина. Три участка дороги. Шанс выбраться.',
    mapStamp: 'ЭВАКУАЦИЯ',
    frequency: '104.8 FM',
};

export const INTRO_FADE_DURATION = 600;

export const INTRO_VOLUME = { radio: 0.22, vehicle: 0.45 };

export const INTRO_SOUNDS: ReadonlyArray<SoundId> = [ 'radio', 'starter', 'stall', 'menuMusic' ];
