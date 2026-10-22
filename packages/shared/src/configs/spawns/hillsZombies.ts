import { GAME_CONFIG } from '../game';

export const ZOMBIE_SPAWNS: ReadonlyArray<{ id: string; x: number }> = Array.from(
    {
        length: Math.ceil(GAME_CONFIG.track.length / GAME_CONFIG.track.zombieSectionLength),
    },
    (_, section) =>
        GAME_CONFIG.track.zombiePositions.map((position, index) => ({
            id: `zombie-${ section * GAME_CONFIG.track.zombiePositions.length + index }`,
            x: position + section * GAME_CONFIG.track.zombieSectionLength,
        })),
)
    .flat()
    .filter((spawn) => spawn.x < GAME_CONFIG.track.length);
