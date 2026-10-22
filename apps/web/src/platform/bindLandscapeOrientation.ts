export function bindLandscapeOrientation(): () => void {
    const app = window.Telegram?.WebApp;

    if (!app?.isVersionAtLeast('8.0') || !app.lockOrientation || app.isOrientationLocked) {
        return (): void => {};
    }

    let didLock = false;

    const lock = (): void => {
        if (!didLock && window.innerWidth > window.innerHeight && app.isActive !== false) {
            didLock = tryOrientation((): void => app.lockOrientation?.());
        }
    };

    window.addEventListener('resize', lock);
    app.onEvent('viewportChanged', lock);
    lock();

    return (): void => {
        window.removeEventListener('resize', lock);
        app.offEvent('viewportChanged', lock);

        if (didLock) {
            tryOrientation((): void => app.unlockOrientation?.());
        }
    };
}

function tryOrientation(action: () => void): boolean {
    try {
        action();

        return true;
    } catch {
        return false;
    }
}
