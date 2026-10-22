import type { SessionInput } from '@zombie-drive/shared';

export function telegramSessionInput(): SessionInput {
    const initData = typeof window === 'undefined' ? undefined : window.Telegram?.WebApp?.initData;

    return initData ? { initData } : {};
}
