import type { Body } from 'planck';

import type { Pose } from './types';

const FULL_TURN = Math.PI * 2;

function capture(body: Body): Pose {
    const { x, y } = body.getPosition();

    return { x, y, angle: body.getAngle() };
}

export class PoseTracker {
    private previous = new Map<Body, Pose>();

    beforeStep(bodies: ReadonlyArray<Body>): void {
        this.previous = new Map(bodies.map((body) => [ body, capture(body) ]));
    }

    pose(body: Body, alpha: number): Pose {
        const current = capture(body);
        const previous = this.previous.get(body) ?? current;
        const difference = (current.angle - previous.angle + Math.PI) % FULL_TURN;
        const angleDifference = ((difference + FULL_TURN) % FULL_TURN) - Math.PI;

        return {
            x: previous.x + (current.x - previous.x) * alpha,
            y: previous.y + (current.y - previous.y) * alpha,
            angle: previous.angle + angleDifference * alpha,
        };
    }
}
