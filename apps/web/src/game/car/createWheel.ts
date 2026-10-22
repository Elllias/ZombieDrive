import { Circle, Vec2, WheelJoint, type Body, type World } from 'planck';

import { GAME_CONFIG, vehicleConfig, type CarStats } from '@zombie-drive/shared';

import { attachSuspensionStops } from './attachSuspensionStops';

interface WheelOptions {
    offsetX: number;
    stats: CarStats;
}

export function createWheel(
    world: World,
    chassis: Body,
    options: WheelOptions,
): { body: Body; joint: WheelJoint } {
    const body = createWheelBody(world, chassis, options);

    const joint = new WheelJoint(
        {
            collideConnected: !!vehicleConfig(options.stats.vehicleId).suspensionTravel,
            frequencyHz: options.stats.springFrequency,
            dampingRatio: options.stats.springDamping,
            enableMotor: true,
            motorSpeed: 0,
            maxMotorTorque: options.stats.driveTorque,
        },
        chassis,
        body,
        body.getPosition(),
        Vec2(0, 1),
    );

    world.createJoint(joint);
    attachSuspensionStops(world, chassis, body, options);

    return { body, joint };
}

function createWheelBody(world: World, chassis: Body, options: WheelOptions): Body {
    const settings = vehicleConfig(options.stats.vehicleId).settings;
    const position = chassis.getWorldPoint(Vec2(options.offsetX, options.stats.axleHeight));

    const body = world.createDynamicBody({
        position,
        angularDamping: settings.wheelDamping,
        allowSleep: false,
    });

    const density = settings.wheelDensity * (settings.wheelRadius / options.stats.wheelRadius) ** 2;

    body.createFixture(new Circle(options.stats.wheelRadius), {
        density,
        friction: options.stats.friction,
        filterGroupIndex: settings.ownCollisionGroup,
        filterCategoryBits: GAME_CONFIG.collisions.car,

        filterMaskBits:
            GAME_CONFIG.collisions.ground | GAME_CONFIG.collisions.alive | GAME_CONFIG.collisions.crate
            | GAME_CONFIG.collisions.barrel | GAME_CONFIG.collisions.suspensionStop,
    });

    return body;
}
