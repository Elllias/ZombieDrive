import { INDUSTRIAL_TRACK } from '../maps/industrial';
import type { CrateSpawn, StageConfig, ZombieSpawn, BarrelSpawn } from '../../stageTypes';

const ZOMBIES: ReadonlyArray<ZombieSpawn> = Array.from({ length: 63 }, (_, index) => ({
    id: `industrial-zombie-${ index }`,

    x: Math.floor(index / 9) * INDUSTRIAL_TRACK.zombieSectionLength
        + (INDUSTRIAL_TRACK.zombiePositions[index % INDUSTRIAL_TRACK.zombiePositions.length] ?? 22),

    kind: index % 3 === 1 ? 'heavy' : 'normal',
}));

const PILE_POSITIONS = [
    38, 96, 152, 252, 320, 404, 452, 576, 632, 716, 816, 866, 984,
    1054, 1140, 1250, 1306, 1430, 1480, 1554, 1660, 1704, 1840, 1900, 1986, 2050,
];

const CRATES: ReadonlyArray<CrateSpawn> = PILE_POSITIONS.flatMap((x, index) => [
    { id: `industrial-crate-${ index }-0`, x: x - 0.5, row: 0 },
    { id: `industrial-crate-${ index }-1`, x: x + 0.5, row: 0 },
    { id: `industrial-crate-${ index }-2`, x, row: 1 },
]);

const BARRELS: ReadonlyArray<BarrelSpawn> = PILE_POSITIONS
    .filter((_, index) => index % 2 === 0)
    .flatMap((x, index) => [
        { id: `barrel-${ index }-0`, x: x + 2, row: 0 },
        { id: `barrel-${ index }-1`, x: x + 3, row: 0 },
    ]);

export const INDUSTRIAL_STAGE: StageConfig = {
    id: 'industrial',
    title: 'Ржавый тракт',
    description: 'Промзона: бочки, тяжёлые зомби и глубокие выемки.',
    vehicleId: 'truck',
    backdropArt: '/art/industrial-landscape.webp',
    groundMaterial: 'asphalt',
    mapPosition: { x: 58, y: 77 },
    track: INDUSTRIAL_TRACK,
    zombies: ZOMBIES,
    crates: CRATES,
    barrels: BARRELS,
};
