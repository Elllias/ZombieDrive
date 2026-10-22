export const ART = {
    zombie: '/art/zombie-profile.webp',
    backdropOverscan: 0.25,
    zombieStrideMeters: 0.85,
    zombieLegSwing: 0.38,
    zombieArmReach: 1.15,
    zombieArmSwing: 0.15,
    zombieFarArmReach: 0.12,
    zombieBobMeters: 0.02,
    zombieWalkingThreshold: 0.05,
    zombieGroundOffsetMeters: 0.025,
} as const;

export const ZOMBIE_FRAMES = [
    { x: 195, y: 22, width: 218, height: 462, flipX: false, depth: 2, tint: 0xffffff },
    { x: 630, y: 87, width: 250, height: 315, flipX: false, depth: 2, tint: 0xffffff },
    { x: 1181, y: 15, width: 156, height: 484, flipX: false, depth: 3, tint: 0xffffff },
    { x: 222, y: 509, width: 157, height: 491, flipX: true, depth: 0.5, tint: 0xb4b6a6 },
    { x: 600, y: 516, width: 242, height: 473, flipX: false, depth: 1, tint: 0xffffff },
    { x: 1176, y: 520, width: 233, height: 475, flipX: true, depth: 0.5, tint: 0xb4b6a6 },
] as const;
