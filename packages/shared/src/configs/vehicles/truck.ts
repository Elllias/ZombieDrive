import { GAME_CONFIG } from '../game';
import type { VehicleConfig } from '../../vehicleTypes';

export const TRUCK_VEHICLE: VehicleConfig = {
    settings: {
        ...GAME_CONFIG.car,
        chassisHalfWidth: 3,
        chassisHalfHeight: 0.3,
        chassisDensity: 145,
        cabinHalfWidth: 0.7,
        cabinHalfHeight: 0.65,
        cabinOffsetX: 2,
        cabinOffsetY: -0.4,
        wheelRadius: 0.56,
        axleY: 0.82,
        wheelDensity: 42,
        motorSpeed: 28,
        brakeTorque: 3200,
        initialTorque: 360,
        torquePerLevel: 140,
        initialFriction: 0.4,
        initialFuelSeconds: 28,
        fuelPerLevel: 27,
        initialSpring: 3.4,
        springPerLevel: 0.28,
    },

    axles: [ -2.31, -0.94, 1.98 ],
    width: 6.5,
    height: 2.05,
    originY: 0.68,
    garageWheelLift: 0.27,
    foregroundAxles: [ 2 ],
    suspensionTravel: { compression: 0.14, extension: 0.22 },
    bodyArt: '/art/truck-body-front-opening.webp',

    wheelWells: [
        [
            { x: 0.07571, y: 0.94631 }, { x: 0.07786, y: 0.93736 },
            { x: 0.07857, y: 0.8613 }, { x: 0.09143, y: 0.78523 },
            { x: 0.10929, y: 0.74049 }, { x: 0.13643, y: 0.71365 },
            { x: 0.15143, y: 0.71365 }, { x: 0.17357, y: 0.73154 },
            { x: 0.19571, y: 0.78076 }, { x: 0.20929, y: 0.85682 },
            { x: 0.20929, y: 0.93736 }, { x: 0.21143, y: 0.94631 },
        ],

        [
            { x: 0.28643, y: 0.94631 }, { x: 0.28929, y: 0.93289 },
            { x: 0.28786, y: 0.87919 }, { x: 0.29071, y: 0.84787 },
            { x: 0.30357, y: 0.78076 }, { x: 0.32571, y: 0.73154 },
            { x: 0.35, y: 0.71365 }, { x: 0.36, y: 0.71365 },
            { x: 0.38429, y: 0.73154 }, { x: 0.40857, y: 0.78971 },
            { x: 0.41929, y: 0.85235 }, { x: 0.42143, y: 0.87919 },
            { x: 0.41929, y: 0.91946 }, { x: 0.42214, y: 0.94631 },
        ],

        [
            { x: 0.71501, y: 0.93923 }, { x: 0.71593, y: 0.89917 },
            { x: 0.72376, y: 0.83978 }, { x: 0.72744, y: 0.77901 },
            { x: 0.73343, y: 0.72928 }, { x: 0.74125, y: 0.68923 },
            { x: 0.75, y: 0.65884 }, { x: 0.75875, y: 0.6395 },
            { x: 0.76888, y: 0.62431 }, { x: 0.77486, y: 0.61878 },
            { x: 0.78131, y: 0.61464 }, { x: 0.82228, y: 0.61464 },
            { x: 0.83103, y: 0.61878 }, { x: 0.83702, y: 0.62431 },
            { x: 0.84807, y: 0.6395 }, { x: 0.85681, y: 0.65884 },
            { x: 0.86648, y: 0.68923 }, { x: 0.87431, y: 0.72928 },
            { x: 0.88122, y: 0.77901 }, { x: 0.88674, y: 0.83978 },
            { x: 0.90193, y: 0.89917 },
        ],
    ],

    title: 'КамАЗ',
    upgrades: [ 'engine', 'tank', 'tires', 'suspension', 'plow' ],
    baseCosts: GAME_CONFIG.economy.baseCosts.truck,
};
