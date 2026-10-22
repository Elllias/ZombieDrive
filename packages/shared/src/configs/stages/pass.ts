import { PASS_TRACK } from '../maps/pass';
import type { CrateSpawn, StageConfig, ZombieSpawn, BarrelSpawn } from '../../stageTypes';

const ZOMBIE_GROUPS = [
    24, 104, 162, 242, 312, 388, 438, 516, 598, 664, 746, 824, 884, 954, 1018,
    1130, 1186, 1250, 1362, 1432, 1498, 1574, 1654, 1722, 1784, 1854, 1922, 2090, 2156, 2290,
];

const PILE_POSITIONS = [
    50, 122, 182, 254, 320, 416, 450, 538, 610, 660, 764, 832, 908, 970, 1030,
    1146, 1200, 1270, 1382, 1454, 1520, 1584, 1664, 1738, 1798, 1872, 1938, 2108, 2174, 2312,
];

const ZOMBIES: ReadonlyArray<ZombieSpawn> = ZOMBIE_GROUPS.flatMap((x, group) =>
    Array.from({ length: 3 }, (_, index) => ({
        id: `pass-zombie-${ group * 3 + index }`,
        x: x + index * 2.5,
        kind: group >= 3 && (index === 1 || (group % 3 === 0 && index === 2)) ? 'heavy' : 'normal',
    })),
);

const CRATES: ReadonlyArray<CrateSpawn> = PILE_POSITIONS.flatMap((x, index) => [
    { id: `pass-crate-${ index }-0`, x: x - 0.5, row: 0 },
    { id: `pass-crate-${ index }-1`, x: x + 0.5, row: 0 },
    { id: `pass-crate-${ index }-2`, x, row: 1 },
    ...(index % 3 === 0 ? [ { id: `pass-crate-${ index }-3`, x: x + 1.5, row: 0 } ] : []),
]);

const BARRELS: ReadonlyArray<BarrelSpawn> = PILE_POSITIONS
    .filter((_, index) => (index >= 3 && index % 2 === 0) || [ 5, 13, 29 ].includes(index))
    .flatMap((x, index) => [
        { id: `pass-barrel-${ index }-0`, x: x + 2.5, row: 0 },
        { id: `pass-barrel-${ index }-1`, x: x + 3.6, row: 0 },
    ]);

export const PASS_STAGE: StageConfig = {
    id: 'pass',
    title: 'Мёртвый перевал',
    description: 'Горная дорога: глубокие ямы, завалы и тяжёлые зомби.',
    vehicleId: 'r8',
    backdropArt: '/art/pass-landscape.webp',
    groundMaterial: 'rock',
    mapPosition: { x: 65, y: 28 },
    track: PASS_TRACK,
    zombies: ZOMBIES,
    crates: CRATES,
    barrels: BARRELS,
};
