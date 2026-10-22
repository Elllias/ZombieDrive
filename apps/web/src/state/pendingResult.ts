import type { z } from 'zod';

import { PendingResultSchema } from '@zombie-drive/shared';

const PENDING_KEY = 'zombie-drive:pending-result';

type PendingResult = z.infer<typeof PendingResultSchema>;

export const pendingResult = {
    read(): PendingResult | null {
        try {
            const stored = localStorage.getItem(PENDING_KEY);

            if (!stored) {
                return null;
            }

            const raw: unknown = JSON.parse(stored);

            return PendingResultSchema.parse(raw);
        } catch (error: unknown) {
            console.error('Не удалось прочитать сохранённый итог заезда', error);

            return null;
        }
    },

    write(result: PendingResult): boolean {
        try {
            localStorage.setItem(PENDING_KEY, JSON.stringify(result));

            return true;
        } catch (error: unknown) {
            console.error('Не удалось сохранить итог на устройстве', error);

            return false;
        }
    },

    clear(): void {
        try {
            localStorage.removeItem(PENDING_KEY);
        } catch (error: unknown) {
            console.error('Не удалось удалить локальный итог', error);
        }
    },
};
