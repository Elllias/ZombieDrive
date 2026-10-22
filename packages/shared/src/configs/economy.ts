export const ECONOMY_CONFIG = {
    maxLevel: 5,
    costGrowth: 2.25,

    rewards: {
        hills: { distanceRate: 0.3, killRate: 4 },
        industrial: { distanceRate: 30, killRate: 400 },
        pass: { distanceRate: 6000, killRate: 80000 },
    },

    baseCosts: {
        suv: { engine: 30, tank: 35, tires: 25, suspension: 25, plow: 100 },
        truck: { engine: 4550, tank: 5250, tires: 2475, suspension: 2475, plow: 6000 },
        r8: { engine: 300000, tank: 1800000, tires: 750000, suspension: 675000, plow: 1350000 },
    },
} as const;
