import { GAME_CONFIG } from '../game';
import type { VehicleConfig } from '../../vehicleTypes';

export const R8_VEHICLE: VehicleConfig = {
    settings: {
        ...GAME_CONFIG.car,
        chassisHalfWidth: 1.95,
        chassisHalfHeight: 0.2,
        chassisDensity: 115,
        cabinHalfWidth: 0.78,
        cabinHalfHeight: 0.35,
        cabinOffsetX: -0.25,
        cabinOffsetY: -0.35,
        wheelRadius: 0.36,
        axleY: 0.45,
        wheelRadiusPerLevel: 0.005,
        axleHeightPerLevel: 0.008,
        wheelDensity: 42,
        motorSpeed: 52,
        initialTorque: 135,
        torquePerLevel: 65,
        initialFriction: 0.3,
        initialFuelSeconds: 25,
        fuelPerLevel: 28,
        initialSpring: 3.6,
        springPerLevel: 0.3,
        initialSpringDamping: 0.15,
        springDampingPerLevel: 0.12,
    },

    axles: [ -1.49, 1.26 ],
    width: 4.45,
    height: 1.52,
    originY: 0.5,
    garageWheelLift: 0.16,
    suspensionTravel: { compression: 0.12, extension: 0.16 },
    bodyArt: '/art/r8-body.webp',

    wheelWells: [
        [
            { x: 0.08103, y: 0.81709 }, { x: 0.07865, y: 0.74633 },
            { x: 0.07912, y: 0.68491 }, { x: 0.08294, y: 0.63151 },
            { x: 0.09152, y: 0.57543 }, { x: 0.102, y: 0.53538 },
            { x: 0.12154, y: 0.48999 }, { x: 0.1387, y: 0.46862 },
            { x: 0.15586, y: 0.45794 }, { x: 0.17588, y: 0.45794 },
            { x: 0.19542, y: 0.4713 }, { x: 0.21211, y: 0.49533 },
            { x: 0.22498, y: 0.5247 }, { x: 0.24071, y: 0.58611 },
            { x: 0.24738, y: 0.63151 }, { x: 0.25167, y: 0.69292 },
            { x: 0.25167, y: 0.75701 }, { x: 0.24738, y: 0.83178 },
            { x: 0.24929, y: 0.8478 }, { x: 0.25167, y: 0.8518 },
        ],

        [
            { x: 0.6959, y: 0.85848 }, { x: 0.69733, y: 0.84112 },
            { x: 0.69352, y: 0.76903 }, { x: 0.69447, y: 0.6996 },
            { x: 0.70019, y: 0.63551 }, { x: 0.70972, y: 0.58211 },
            { x: 0.72069, y: 0.54206 }, { x: 0.74023, y: 0.49933 },
            { x: 0.75786, y: 0.47797 }, { x: 0.78027, y: 0.46729 },
            { x: 0.78837, y: 0.46729 }, { x: 0.8103, y: 0.47797 },
            { x: 0.82745, y: 0.49933 }, { x: 0.84795, y: 0.5474 },
            { x: 0.85844, y: 0.59012 }, { x: 0.86511, y: 0.63284 },
            { x: 0.86988, y: 0.69693 }, { x: 0.86988, y: 0.76101 },
            { x: 0.86416, y: 0.84112 }, { x: 0.86511, y: 0.8478 },
        ],
    ],

    plowAppearance: {
        art: '/art/r8-plow.webp',
        width: 0.94,
        height: 0.64,
        x: 2.06,
        y: 0.25,
    },

    title: 'Audi R8',
    upgrades: [ 'engine', 'tank', 'tires', 'suspension', 'plow' ],
    baseCosts: GAME_CONFIG.economy.baseCosts.r8,
};
