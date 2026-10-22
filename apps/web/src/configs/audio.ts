import type { VehicleId } from '@zombie-drive/shared';

export const AUDIO_FILES = {
    engineSuv: 'engine-suv.wav',
    engineTruck: 'engine-truck.wav',
    engineR8: 'engine-r8.wav',
    starter: 'starter.mp3',
    stall: 'engine-stall.mp3',
    menuMusic: 'menu-rock.mp3',
    radio: 'radio.wav',
    wind: 'wind.wav',
    click: 'click.mp3',
    purchase: 'purchase.mp3',
    wood: 'wood.mp3',
    metal: 'metal.mp3',
    hit: 'hit.mp3',
    groan1: 'groan-1.mp3',
    groan2: 'groan-2.mp3',
    explosion: 'explosion.mp3',
};

export type SoundId = keyof typeof AUDIO_FILES;
export type EngineSound = 'engineSuv' | 'engineTruck' | 'engineR8';

export const COMMON_SOUNDS: ReadonlyArray<SoundId> = [
    'click', 'purchase', 'wood', 'metal', 'hit', 'groan1', 'groan2', 'wind',
];

export const ENGINE_SOUNDS: Record<VehicleId, EngineSound> = {
    suv: 'engineSuv', truck: 'engineTruck', r8: 'engineR8',
};
