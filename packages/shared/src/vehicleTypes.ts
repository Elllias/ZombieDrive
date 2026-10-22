import type { GAME_CONFIG } from './configs/game';
import type { Upgrade } from './schemas';

type CarSettings = { readonly [Setting in keyof typeof GAME_CONFIG.car]: number };

/** Coordinates relative to the body sprite, from 0 to 1. */
interface WheelWellPoint {
    x: number;
    y: number;
}

type WheelWellOutline = ReadonlyArray<WheelWellPoint>;

export interface PlowAppearance {
    art: string;
    width: number;
    height: number;
    x: number;
    y: number;
}

export interface VehicleConfig {
    settings: CarSettings;
    axles: ReadonlyArray<number>;
    width: number;
    height: number;
    originY: number;
    /** Static wheel lift relative to the garage body, in meters. */
    garageWheelLift?: number;
    /** Indices into axles for wheels drawn in front of the body. */
    foregroundAxles?: ReadonlyArray<number>;
    suspensionTravel?: { compression: number; extension: number };
    bodyArt: string;
    wheelWells: ReadonlyArray<WheelWellOutline>;
    plowAppearance?: PlowAppearance;
    title: string;
    upgrades: ReadonlyArray<Upgrade>;
    baseCosts: Record<Upgrade, number>;
}
