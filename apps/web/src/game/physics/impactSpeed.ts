import { Vec2, type Contact } from 'planck';

export function impactSpeed(contact: Contact): number {
    const manifold = contact.getWorldManifold(null);
    const point = manifold?.points[0];

    if (!manifold || !point) {
        return 0;
    }

    const first = contact.getFixtureA().getBody().getLinearVelocityFromWorldPoint(point);
    const second = contact.getFixtureB().getBody().getLinearVelocityFromWorldPoint(point);

    return Math.max(0, Vec2.dot(Vec2.sub(first, second), manifold.normal));
}
