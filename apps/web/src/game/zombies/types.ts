import type { Body } from 'planck';

import type { PhysicalPart } from '../physics/types';

export interface Zombie {
    id: string;
    kind: 'normal' | 'heavy';
    scale: number;
    canHitBarrels: boolean;
    state: 'waiting' | 'walking' | 'ragdoll';
    body: Body;
    parts: Array<PhysicalPart>;
}
