import { expect, it } from 'vitest';

import { GAME_CONFIG } from '@zombie-drive/shared';

import { runViewport } from '../apps/web/src/game/rendering/runViewport';

import { IDLE, simulation } from './physics.helpers';

it.each([
    { width: 960, height: 540 },
    { width: 1280, height: 590 },
    { width: 915, height: 412 },
    { width: 1920, height: 1080 },
    { width: 2560, height: 1080 },
    { width: 412, height: 915 },
])('fills a $width × $height window with a uniform world scale', (size): void => {
    const viewport = runViewport(size);

    expect(viewport.width * viewport.zoom).toBeCloseTo(size.width, 10);
    expect(viewport.height * viewport.zoom).toBeCloseTo(size.height, 10);
    expect(viewport.height).toBe(GAME_CONFIG.rendering.height);
    expect(size.width / viewport.width).toBeCloseTo(size.height / viewport.height, 10);
});

it('keeps a finite viewport while the parent temporarily has no size', (): void => {
    const viewport = runViewport({ width: 0, height: 0 });

    expect(viewport.width).toBeGreaterThan(0);
    expect(viewport.zoom).toBeGreaterThan(0);
    expect(Number.isFinite(viewport.width)).toBe(true);
});

it('updates visible terrain bounds on resize without advancing the run', (): void => {
    const game = simulation();
    const previous = game.view;
    const position = game.car.chassis.getPosition().clone();
    const viewport = runViewport({ width: 1280, height: 590 });

    game.setViewWidth(viewport.width);

    expect(game.view.right - game.view.left).toBeCloseTo(viewport.width / GAME_CONFIG.rendering.pixelsPerMeter);
    expect(game.view.top).toBe(previous.top);
    expect(game.view.bottom).toBe(previous.bottom);
    expect(game.car.chassis.getPosition()).toEqual(position);
    expect(game.rules.elapsed).toBe(0);
    game.setViewWidth(GAME_CONFIG.rendering.width);
    expect(game.view).toEqual(previous);
});

it('activates zombies that become visible in the extra width', (): void => {
    const rendering = GAME_CONFIG.rendering;
    const x = GAME_CONFIG.car.startX + rendering.cameraLead + rendering.width / rendering.pixelsPerMeter / 2 + 0.5;
    const game = simulation([ { id: 'wide-screen-zombie', x } ]);

    game.step(IDLE);
    expect(game.zombies.actors[0]?.state).toBe('waiting');
    game.setViewWidth(runViewport({ width: 1280, height: 590 }).width);
    game.step(IDLE);
    expect(game.zombies.actors[0]?.state).toBe('walking');
});

it('keeps the car in view when rotating into a narrow portrait viewport', (): void => {
    const game = simulation();
    const position = game.car.chassis.getPosition();
    const viewport = runViewport({ width: 412, height: 915 });

    game.setViewWidth(viewport.width);

    expect(position.x).toBeGreaterThan(game.view.left);
    expect(position.x).toBeLessThan(game.view.right);
    expect(position.y).toBeGreaterThan(game.view.top);
    expect(position.y).toBeLessThan(game.view.bottom);
});
