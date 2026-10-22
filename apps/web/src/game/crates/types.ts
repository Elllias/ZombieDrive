import type { PhysicalPart } from '../physics/types';

export interface Crate {
    id: string;
    part: PhysicalPart;
    isBroken: boolean;
}

export interface CrateFragment {
    id: string;
    part: PhysicalPart;
    frame: number;
    remainingSeconds: number;
}
