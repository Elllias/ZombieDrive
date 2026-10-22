import { GAME_CONFIG } from '../game';
import type { CrateSpawn } from '../../stageTypes';

export const CRATE_SPAWNS: ReadonlyArray<CrateSpawn> = GAME_CONFIG.crates.pilePositions.flatMap((x, pile) => {
    const bottom = [ -0.5, 0.5 ].map((offset, index) => ({
        id: `crate-${ pile }-${ index }`,
        x: x + offset,
        row: 0,
    }));

    if (pile % 3 === 0) {
        return bottom;
    }

    return [ ...bottom, { id: `crate-${ pile }-2`, x, row: 1 } ];
});
