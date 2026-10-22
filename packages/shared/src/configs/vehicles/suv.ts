import { GAME_CONFIG } from '../game';
import type { VehicleConfig } from '../../vehicleTypes';

export const SUV_VEHICLE: VehicleConfig = {
    settings: GAME_CONFIG.car,
    axles: [ -GAME_CONFIG.car.axleX, GAME_CONFIG.car.axleX ],
    width: 4,
    height: 2,
    originY: 0.5,
    bodyArt: '/art/suv-body.webp',

    wheelWells: [
        [
            { x: 0.10541, y: 0.80609 }, { x: 0.10654, y: 0.77227 },
            { x: 0.11161, y: 0.72943 }, { x: 0.12063, y: 0.69109 },
            { x: 0.12909, y: 0.66855 }, { x: 0.14487, y: 0.63923 },
            { x: 0.15671, y: 0.6257 }, { x: 0.17587, y: 0.61218 },
            { x: 0.19278, y: 0.60767 }, { x: 0.20631, y: 0.60767 },
            { x: 0.22717, y: 0.61443 }, { x: 0.2469, y: 0.63021 },
            { x: 0.26156, y: 0.65051 }, { x: 0.27339, y: 0.67531 },
            { x: 0.28016, y: 0.6956 }, { x: 0.28861, y: 0.73619 },
            { x: 0.292, y: 0.77227 }, { x: 0.292, y: 0.81398 },
        ],

        [
            { x: 0.69842, y: 0.82976 }, { x: 0.70068, y: 0.75423 },
            { x: 0.70688, y: 0.7159 }, { x: 0.71984, y: 0.67306 },
            { x: 0.73619, y: 0.64149 }, { x: 0.75479, y: 0.6212 },
            { x: 0.78523, y: 0.60767 }, { x: 0.7982, y: 0.60767 },
            { x: 0.81567, y: 0.61218 }, { x: 0.83484, y: 0.6257 },
            { x: 0.85006, y: 0.64374 }, { x: 0.86584, y: 0.67531 },
            { x: 0.8805, y: 0.73393 }, { x: 0.88444, y: 0.77903 },
            { x: 0.88444, y: 0.81736 },
        ],
    ],

    title: 'Внедорожник',
    upgrades: [ 'engine', 'tank', 'tires', 'suspension' ],
    baseCosts: GAME_CONFIG.economy.baseCosts.suv,
};
