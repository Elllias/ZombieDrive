export const HAZARDS = {
    heavyZombie: {
        scale: 1.55,
        density: 180,
        speed: 0.65,
        impact: { speedRetention: 0.42, maxSpeedLoss: 7, minImpactSpeed: 1.5 },
        rewardMultiplier: 2,
    },

    barrel: {
        halfWidth: 0.36,
        halfHeight: 0.55,
        density: 55,
        friction: 0.6,
        minimumImpactSpeed: 2.2,
        detonationImpulse: 90,
        blastRadius: 4.5,
        blastImpulse: 2300,
        chainRadius: 2.6,
        blastBreakImpulse: 150,
        blastKillImpulse: 100,
        effectSeconds: 0.8,
        activeAhead: 42,
        activeBehind: 20,
    },

    plow: {
        forwardOffset: 0.2,
        offsetY: 0.08,
        halfWidth: 0.38,
        halfHeight: 0.58,
        resistanceReduction: 0.72,
        throwSpeed: 3,
    },
} as const;
