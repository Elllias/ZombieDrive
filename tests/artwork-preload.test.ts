import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { stageConfig, vehicleConfig } from '@zombie-drive/shared';

import { ARTWORK_LOAD_TIMEOUT_MS } from '../apps/web/src/configs/artwork';
import { preloadImage } from '../apps/web/src/artwork/preloadImage';
import { prepareGarageArtwork } from '../apps/web/src/artwork/prepareGarageArtwork';

import { PROGRESS } from './result-recovery.helpers';
import { pendingArtwork } from './artwork.helpers';

const created: Array<ImageStub> = [];

class ImageStub {
    src = '';
    decoding = '';
    fetchPriority = '';
    readonly result = pendingArtwork();

    constructor() {
        created.push(this);
    }

    decode(): Promise<void> {
        return this.result.ready;
    }

    removeAttribute(): void {
        this.src = '';
    }
}

beforeEach((): void => {
    created.length = 0;
    vi.stubGlobal('Image', ImageStub);
});

afterEach((): void => {
    created.forEach((image): void => image.result.complete());
    vi.useRealTimers();
    vi.unstubAllGlobals();
});

it('shares an image request and retains its decoded bitmap across garage changes', async (): Promise<void> => {
    const ready = preloadImage('/art/test-shared.webp');
    const repeated = preloadImage('/art/test-shared.webp');

    expect(repeated).toBe(ready);
    expect(created).toHaveLength(1);
    created[0]?.result.complete();

    const image = await ready;

    expect(image.src).toBe('/art/test-shared.webp');
    expect(await preloadImage('/art/test-shared.webp')).toBe(image);
    expect(created).toHaveLength(1);
});

it('evicts a failed decode so retrying requests the image again', async (): Promise<void> => {
    const ready = preloadImage('/art/test-retry.webp');
    const failed = expect(ready).rejects.toThrow('Не удалось загрузить графику');

    created[0]?.result.fail(new Error('Network interrupted'));
    await failed;

    const retry = preloadImage('/art/test-retry.webp');

    expect(created).toHaveLength(2);
    created[1]?.result.complete();
    expect((await retry).src).toBe('/art/test-retry.webp');
});

it('bounds a hung image request and allows another attempt', async (): Promise<void> => {
    vi.useFakeTimers();

    const ready = preloadImage('/art/test-timeout.webp');
    const failed = expect(ready).rejects.toThrow('Не удалось загрузить графику');

    await vi.advanceTimersByTimeAsync(ARTWORK_LOAD_TIMEOUT_MS);
    await failed;
    expect(created[0]?.src).toBe('');

    const retry = preloadImage('/art/test-timeout.webp');

    expect(created).toHaveLength(2);
    created[1]?.result.complete();
    await retry;
});

it('prepares the selected garage in parallel and warms only other unlocked bodies afterwards', async (): Promise<void> => {
    const progress = { ...PROGRESS,
        stageId: 'industrial',

        stages: [
            { stageId: 'industrial', bestDistance: 0, completed: false },
            { stageId: 'hills', bestDistance: 1740, completed: true },
        ] } as const;

    const ready = prepareGarageArtwork({ ...progress, stages: [ ...progress.stages ] });
    const truck = vehicleConfig(stageConfig('industrial').vehicleId);
    const body = created.find((image) => image.src === truck.bodyArt);

    expect(body).toBeDefined();
    expect(created.some((image) => image.src === '/art/wheel-0.webp')).toBe(true);
    expect(created.some((image) => image.src === '/art/plow.webp')).toBe(true);
    created.filter((image) => image !== body).forEach((image): void => image.result.complete());
    expect(created.some((image) => image.src === '/art/suv-body.webp')).toBe(false);
    body?.result.complete();
    await ready;
    expect(created.find((image) => image.src === '/art/suv-body.webp')?.fetchPriority).toBe('low');
    expect(created.some((image) => image.src === '/art/r8-body.webp')).toBe(false);
});
