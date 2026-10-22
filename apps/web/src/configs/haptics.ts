export const HAPTIC_STRENGTH = { light: 1, medium: 2, heavy: 3 };

export type HapticStyle = keyof typeof HAPTIC_STRENGTH;

export const HAPTIC_INTERVAL_MILLISECONDS = 180;
export const LANDING_HAPTIC_MINIMUM_VOLUME = 0.35;
export const LANDING_HAPTIC_HEAVY_VOLUME = 0.6;
