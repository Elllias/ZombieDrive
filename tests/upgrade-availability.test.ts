import { expect, it, vi } from 'vitest';

import type { Progress } from '@zombie-drive/shared';

import { formatPrice } from '../apps/web/src/ui/common/formatPrice';

import { tierAvailability, upgradeTiers } from '../apps/web/src/ui/garage/UpgradeDialog.utils';
import { upgradeCardPrice } from '../apps/web/src/ui/garage/UpgradeCard.utils';
import type { TierProps } from '../apps/web/src/ui/garage/UpgradeDialog.types';

const PROGRESS: Progress = {
    stageId: 'industrial',
    balance: 6000,
    bestDistance: 0,
    activeRun: null,
    upgrades: { engine: 0, tank: 0, tires: 0, suspension: 0, plow: 0 },
};

function tier(overrides: Partial<TierProps> = {}): TierProps {
    return { upgrade: 'plow',
        tier: 1,
        progress: PROGRESS,
        isBusy: false,
        error: null,
        onBuy: vi.fn(),
        onClose: vi.fn(),
        ...overrides };
}

it('offers a single installation for the stage price and never offers another plow tier', (): void => {
    expect(upgradeTiers('plow', 0)).toEqual([ 0, 1 ]);
    expect(tierAvailability(tier())).toMatchObject({ cost: 6000, disabled: false, status: 'Установить' });
    expect(tierAvailability(tier({ tier: 0 })).disabled).toBe(true);
    expect(tierAvailability(tier({ tier: 2 })).disabled).toBe(true);
    expect(upgradeCardPrice(PROGRESS, 'plow')).toBe('$6\u00a0000');

    const progress = { ...PROGRESS, upgrades: { ...PROGRESS.upgrades, plow: 1 } };

    expect(upgradeTiers('plow', 1)).toEqual([ 0, 1 ]);
    expect(tierAvailability(tier({ progress }))).toMatchObject({ disabled: true, status: 'Установлено' });
    expect(tierAvailability(tier({ progress, tier: 2 })).disabled).toBe(true);
    expect(upgradeCardPrice(progress, 'plow')).toBe('Установлен');
});

it('disables installation without enough funds or while a request is pending', (): void => {
    expect(tierAvailability(tier({ progress: { ...PROGRESS, balance: 5999 } }))).toMatchObject({
        disabled: true, status: 'Не хватает денег',
    });

    expect(tierAvailability(tier({ isBusy: true }))).toMatchObject({ disabled: true, status: 'Установка…' });
});

it('keeps the ordinary upgrade levels and next-tier purchase available', (): void => {
    const progress = { ...PROGRESS, balance: 50000, upgrades: { ...PROGRESS.upgrades, engine: 1 } };

    expect(upgradeTiers('engine', 1)).toEqual([ 1, 2, 3 ]);
    expect(upgradeTiers('engine', 5)).toEqual([ 3, 4, 5 ]);

    expect(tierAvailability(tier({ upgrade: 'engine', tier: 2, progress }))).toMatchObject({
        cost: 10238, disabled: false, status: 'Купить',
    });

    expect(tierAvailability(tier({ upgrade: 'engine', tier: 3, progress })).disabled).toBe(true);
});

it('keeps million-scale card prices readable while exposing the exact purchase price', (): void => {
    const progress = { ...PROGRESS, stageId: 'pass', balance: 100000000, upgrades: { ...PROGRESS.upgrades, tank: 4 } } as const;
    const availability = tierAvailability(tier({ upgrade: 'tank', tier: 5, progress }));

    expect(availability.cost).toBe(46132032);
    expect(availability.label).toContain('$46\u00a0132\u00a0032');
    expect(formatPrice(availability.cost)).toBe('$46,13\u00a0млн');
    expect(upgradeCardPrice(progress, 'tank')).toBe('$46,13\u00a0млн');
});
