import type { RunReport } from '@zombie-drive/shared';

export const REASON_LABELS: Record<RunReport['reason'], string> = {
    finish: 'Финиш достигнут',
    fuel: 'Топливо закончилось',
    rollover: 'Машина перевернулась',
    stuck: 'Машина остановилась',
    timeout: 'Время вышло',
    abandon: 'Заезд покинут',
};
