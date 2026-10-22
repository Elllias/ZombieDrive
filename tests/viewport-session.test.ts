import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { ViewportSession } from '../apps/web/src/ui/run/ViewportSession';
import { GameBridge } from '../apps/web/src/game/GameBridge';

import { RUN } from './result-recovery.helpers';

const viewport = vi.hoisted(() => {
    const parent = { width: 960, height: 540 };
    const measured = { ...parent };
    const canvas = { ...parent };

    return {
        parent,
        canvas,
        resize: (): void => {},
        disconnect: vi.fn(),

        game: {
            scale: {
                getParentBounds: vi.fn(() => Object.assign(measured, parent)),
                refresh: vi.fn(() => Object.assign(canvas, measured)),
            },

            destroy: vi.fn(),
        },

        createGame: vi.fn(),
    };
});

vi.mock('../apps/web/src/game/createGame', () => ({ createGame: viewport.createGame }));

let session: ViewportSession | null = null;

beforeEach((): void => {
    vi.clearAllMocks();
    viewport.createGame.mockReturnValue(viewport.game);
    Object.assign(viewport.parent, { width: 1280, height: 590 });
    vi.stubGlobal('document', { createElement: () => ({}) });

    vi.stubGlobal('ResizeObserver', class {
        readonly observe = vi.fn();
        readonly disconnect = viewport.disconnect;

        constructor(callback: () => void) {
            viewport.resize = callback;
        }
    });
});

afterEach((): void => {
    session?.destroy();
    session = null;
    vi.unstubAllGlobals();
});

function createSession(): ViewportSession {
    return new ViewportSession(document.createElement('div'), {
        run: RUN,
        bridge: new GameBridge(),
        onError: vi.fn(),
    });
}

it('measures the full parent before the initial canvas refresh', async (): Promise<void> => {
    session = createSession();
    await vi.dynamicImportSettled();
    expect(viewport.createGame).toHaveBeenCalledOnce();
    expect(viewport.canvas).toEqual({ width: 1280, height: 590 });
});

it('applies each new parent size on the first resize notification', async (): Promise<void> => {
    session = createSession();
    await vi.dynamicImportSettled();

    for (const size of [ { width: 915, height: 412 }, { width: 412, height: 915 }, { width: 1280, height: 590 } ]) {
        Object.assign(viewport.parent, size);
        viewport.resize();
        expect(viewport.canvas).toEqual(size);
    }
});

it('disconnects observation and cancels game creation when unmounted during loading', async (): Promise<void> => {
    session = createSession();
    session.destroy();
    session = null;
    await vi.dynamicImportSettled();
    expect(viewport.disconnect).toHaveBeenCalledOnce();
    expect(viewport.createGame).not.toHaveBeenCalled();
});
