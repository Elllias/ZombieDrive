import type { PhysicalPart } from '../physics/types';
import type { Car } from '../car/Car';
import type { Crates } from '../crates/Crates';
import type { Zombies } from '../zombies/Zombies';

export interface Barrel {
    id: string;
    isExploded: boolean;
    part: PhysicalPart;
}

export interface Explosion {
    x: number;
    y: number;
    age: number;
}

export interface BlastTargets {
    car: Pick<Car, 'bodies'>;
    crates: Pick<Crates, 'breakBody'>;
    zombies: Pick<Zombies, 'kill'>;
}
