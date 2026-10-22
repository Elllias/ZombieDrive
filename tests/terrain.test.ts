import { expect, it } from 'vitest';

import { GAME_CONFIG, terrainHeight } from '@zombie-drive/shared';

import { terrainChunkBounds } from '../apps/web/src/game/rendering/terrainChunkBounds';

it('has continuous hills and ramps with increasing control points and no vertical walls', (): void => {
    const profile = GAME_CONFIG.track.heightProfile;

    profile.forEach((point, index): void => {
        expect(terrainHeight(point.x)).toBeCloseTo(GAME_CONFIG.track.floorY + point.height, 10);

        const previous = profile[index - 1];

        if (!previous) {
            return;
        }

        expect(point.x).toBeGreaterThan(previous.x);
        expect(Math.abs((point.height - previous.height) / (point.x - previous.x))).toBeLessThanOrEqual(1);
        expect(Math.abs(terrainHeight(point.x - 0.001) - terrainHeight(point.x + 0.001))).toBeLessThan(0.002);
    });

    expect(terrainHeight(-12)).toBe(7);
    expect(terrainHeight(29)).toBe(7);
    expect(terrainHeight(GAME_CONFIG.track.length + 30)).toBe(7);
});

it('draws the highest crest and deepest valley without clipping their ground textures', (): void => {
    const crest = terrainChunkBounds({ start: 288, end: 304 });
    const valley = terrainChunkBounds({ start: 448, end: 464 });

    expect(crest.top).toBeLessThan(terrainHeight(292));

    expect(valley.bottom).toBeGreaterThan(
        terrainHeight(450) + GAME_CONFIG.rendering.height / GAME_CONFIG.rendering.pixelsPerMeter,
    );
});

it('creates jumps on the new terrain during an actual drive', async (): Promise<void> => {
    const [ { GameSimulation }, { carStats } ] = await Promise.all([
        import('../apps/web/src/game/GameSimulation'),
        import('@zombie-drive/shared'),
    ]);

    const game = new GameSimulation(carStats({ engine: 5, tank: 5, tires: 5, suspension: 5 }));
    let longestFlight = 0;
    let flight = 0;

    for (let step = 0; step < 3600 && !game.rules.reason; step += 1) {
        game.step({ gas: true, brake: false, tilt: 0 });
        flight = game.car.isGrounded() ? 0 : flight + 1;
        longestFlight = Math.max(longestFlight, flight);
    }

    expect(longestFlight * GAME_CONFIG.world.stepSeconds).toBeGreaterThan(0.5);
});

it.each([
    { entry: 398, bottom: 430, exit: 468 },
    { entry: 988, bottom: 1020, exit: 1052 },
    { entry: 1454, bottom: 1490, exit: 1516 },
])('has a deep pit at $bottom with a steep exit', (pit): void => {
    expect(terrainHeight(pit.bottom) - terrainHeight(pit.entry)).toBeGreaterThanOrEqual(9);
    expect(terrainHeight(pit.bottom) - terrainHeight(pit.exit)).toBeGreaterThanOrEqual(9);

    const exitSlope = terrainHeight(pit.exit - 1) - terrainHeight(pit.exit);

    expect(exitSlope).toBeGreaterThanOrEqual(0.65);
});
