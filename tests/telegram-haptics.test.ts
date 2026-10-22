import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { browser, sdk } from './telegram-sdk.helpers';
import { storage } from './result-recovery.helpers';

let app: ReturnType<typeof sdk>;
let haptics: typeof import('../apps/web/src/platform/Haptics').HAPTICS;

beforeEach(async (): Promise<void> => {
    vi.resetModules();
    vi.useFakeTimers();
    browser();
    storage();
    app = sdk();
    app.HapticFeedback = { impactOccurred: vi.fn(), notificationOccurred: vi.fn() };
    window.Telegram = { WebApp: app };
    haptics = (await import('../apps/web/src/platform/Haptics')).HAPTICS;
});

afterEach((): void => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
});

it('combines simultaneous collisions into the strongest feedback and limits its frequency', async (): Promise<void> => {
    const { playRunHaptics } = await import('../apps/web/src/game/feedback/playRunHaptics');

    playRunHaptics([
        { sound: 'wood', volume: 0.6, rate: 1 },
        { sound: 'hit', volume: 0.8, rate: 1, isHeavy: true },
        { sound: 'explosion', volume: 0.8, rate: 1 },
    ]);

    playRunHaptics([ { sound: 'wood', volume: 0.6, rate: 1 } ]);
    expect(app.HapticFeedback?.impactOccurred).toHaveBeenCalledExactlyOnceWith('heavy');
    await vi.advanceTimersByTimeAsync(180);
    playRunHaptics([ { sound: 'hit', volume: 0.8, rate: 1, isHeavy: true } ]);
    expect(app.HapticFeedback?.impactOccurred).toHaveBeenLastCalledWith('medium');
    expect(app.HapticFeedback?.impactOccurred).toHaveBeenCalledTimes(2);
});

it('ignores small landings and gives strong landings a heavier feedback', async (): Promise<void> => {
    const { playRunHaptics } = await import('../apps/web/src/game/feedback/playRunHaptics');

    playRunHaptics([ { sound: 'metal', volume: 0.2, rate: 1 } ]);
    expect(app.HapticFeedback?.impactOccurred).not.toHaveBeenCalled();
    playRunHaptics([ { sound: 'metal', volume: 0.65, rate: 1 } ]);
    expect(app.HapticFeedback?.impactOccurred).toHaveBeenCalledExactlyOnceWith('heavy');
});

it('persists the separate vibration preference without depending on sound settings', async (): Promise<void> => {
    const { PREFERENCES } = await import('../apps/web/src/platform/preferences');

    PREFERENCES.write('muted', true);
    haptics.impact('light');
    expect(app.HapticFeedback?.impactOccurred).toHaveBeenCalledOnce();
    haptics.toggle();
    haptics.success();
    expect(app.HapticFeedback?.notificationOccurred).not.toHaveBeenCalled();
    vi.resetModules();

    const restored = (await import('../apps/web/src/platform/Haptics')).HAPTICS;

    expect(restored.getDisabled()).toBe(true);
    restored.toggle();
    restored.success();
    expect(app.HapticFeedback?.notificationOccurred).toHaveBeenCalledExactlyOnceWith('success');
});

it('stays silent while Telegram is inactive or the document is hidden', (): void => {
    app.isActive = false;
    haptics.impact('heavy');
    haptics.success();
    app.isActive = true;
    vi.stubGlobal('document', { hidden: true });
    haptics.impact('heavy');
    expect(app.HapticFeedback?.impactOccurred).not.toHaveBeenCalled();
    expect(app.HapticFeedback?.notificationOccurred).not.toHaveBeenCalled();
});

it('does not interrupt the game when native feedback is unavailable or throws', (): void => {
    vi.mocked(app.isVersionAtLeast).mockReturnValue(false);
    expect(() => haptics.impact('heavy')).not.toThrow();
    expect(app.HapticFeedback?.impactOccurred).not.toHaveBeenCalled();
    vi.mocked(app.isVersionAtLeast).mockReturnValue(true);

    app.HapticFeedback = {
        impactOccurred: (): never => { throw new Error('Native feature unavailable'); },
        notificationOccurred: vi.fn(),
    };

    expect(() => haptics.impact('heavy')).not.toThrow();
    expect(haptics.getDisabled()).toBe(false);
});
