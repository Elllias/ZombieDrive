import type { GroundMaterial } from '@zombie-drive/shared';

export interface SoilLayer {
    offset: number;
    color: number;
    wave: number;
}

export interface TerrainTheme {
    layers: ReadonlyArray<SoilLayer>;
    loose: { shadow: number; stone: number; rut: number; highlight: number };
    texture: { art: string; opacity: number } | null;
}

export const TERRAIN_THEMES: Record<GroundMaterial, TerrainTheme> = {
    dirt: {
        layers: [
            { offset: 0, color: 0x8b552b, wave: 0 },
            { offset: 0.3, color: 0x4b2b13, wave: 0 },
            { offset: 1.6, color: 0x38200e, wave: 0.25 },
            { offset: 3.1, color: 0x563319, wave: 0.45 },
            { offset: 5.5, color: 0x352110, wave: 0.3 },
        ],

        loose: { shadow: 0x69503a, stone: 0x9a7651, rut: 0x453424, highlight: 0xbaa07b },
        texture: null,
    },

    asphalt: {
        layers: [
            { offset: 0, color: 0x55564f, wave: 0 },
            { offset: 0.2, color: 0x343834, wave: 0.035 },
            { offset: 0.45, color: 0x716451, wave: 0.08 },
            { offset: 1.6, color: 0x49463b, wave: 0.2 },
            { offset: 3.8, color: 0x34352e, wave: 0.35 },
            { offset: 6.2, color: 0x252b26, wave: 0.25 },
        ],

        loose: { shadow: 0x383d38, stone: 0x929080, rut: 0x252a27, highlight: 0xb2aa8d },
        texture: { art: '/art/asphalt-ground.webp', opacity: 0.42 },
    },

    rock: {
        layers: [
            { offset: 0, color: 0x92816b, wave: 0 },
            { offset: 0.24, color: 0x635b4f, wave: 0.04 },
            { offset: 0.8, color: 0x736854, wave: 0.12 },
            { offset: 2, color: 0x494b43, wave: 0.3 },
            { offset: 3.5, color: 0x615947, wave: 0.38 },
            { offset: 5.2, color: 0x393c35, wave: 0.22 },
            { offset: 7, color: 0x4a4539, wave: 0.3 },
        ],

        loose: { shadow: 0x514b40, stone: 0xa39479, rut: 0x3e3b32, highlight: 0xd0b995 },
        texture: { art: '/art/rock-ground.webp', opacity: 0.48 },
    },
};
