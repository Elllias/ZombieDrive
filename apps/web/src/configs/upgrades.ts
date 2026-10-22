import { type Upgrade } from '@zombie-drive/shared';

export const UPGRADE_DETAILS: Record<Upgrade, { title: string; description: string }> = {
    engine: { title: 'Двигатель', description: 'Больше тяги на подъёмах и при ударах' },

    tank: {
        title: 'Топливный бак',
        description: 'Больше времени в пути — запас топлива растёт с каждым уровнем',
    },

    tires: { title: 'Шины', description: 'Меньше пробуксовки на рыхлых подъёмах, легче выбираться из ям' },

    plow: {
        title: 'Ковш',
        description: 'Одноразовая установка. Уменьшает сопротивление зомби при лобовом ударе на 72%. Подбрасывает тела вперёд.',
    },

    suspension: { title: 'Подвеска', description: 'Меньше раскачки после кочек и прыжков — дольше сохраняешь скорость' },
};
