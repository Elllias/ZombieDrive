export interface TrackConfig {
    length: number;
    sampleSpacing: number;
    groundFriction: number;
    looseGroundFriction: number;
    looseSections: ReadonlyArray<{ start: number; end: number }>;
    floorY: number;
    zombieSectionLength: number;
    zombiePositions: ReadonlyArray<number>;
    heightProfile: ReadonlyArray<{ x: number; height: number }>;
}
