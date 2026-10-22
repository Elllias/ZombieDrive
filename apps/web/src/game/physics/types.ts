import type { Body } from 'planck';

export interface Controls {
    gas: boolean;
    brake: boolean;
    tilt: number;
}

type PartShape =
    | { kind: 'box'; halfWidth: number; halfHeight: number }
    | { kind: 'circle'; radius: number };

export interface PhysicalPart {
    body: Body;
    shape: PartShape;
}

export interface ViewBounds {
    left: number;
    right: number;
    top: number;
    bottom: number;
}

export interface Pose {
    x: number;
    y: number;
    angle: number;
}
