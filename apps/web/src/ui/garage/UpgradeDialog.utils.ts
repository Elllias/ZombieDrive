import { upgradeCost, upgradeMaxLevel, stageConfig, type Upgrade } from '@zombie-drive/shared';

import { UPGRADE_DETAILS } from '../../configs/upgrades';
import type { TierProps } from './UpgradeDialog.types';

export function tierAvailability(props: TierProps): {
    cost: number;
    disabled: boolean;
    label: string;
    status: string;
} {
    const level = (props.progress.upgrades[props.upgrade] ?? 0);
    const isNext = props.tier === level + 1 && props.tier <= upgradeMaxLevel(props.upgrade);
    const cost = upgradeCost(props.upgrade, Math.max(0, props.tier - 1), stageConfig(props.progress.stageId).vehicleId);
    const disabled = !isNext || props.isBusy || props.progress.balance < cost || props.progress.activeRun !== null;

    const name = props.upgrade === 'plow'
        ? tierName(props.upgrade, props.tier)
        : `${ UPGRADE_DETAILS[props.upgrade].title }, уровень ${ props.tier }`;

    const label = name
        + (isNext ? `, купить за $${ cost.toLocaleString('ru-RU') }` : '');

    return { cost, disabled, label, status: tierStatus(props, level, cost) };
}

export function upgradeTiers(upgrade: Upgrade, level: number): Array<number> {
    const maximum = upgradeMaxLevel(upgrade);
    const count = Math.min(3, maximum + 1);
    const first = Math.min(level, maximum - count + 1);

    return Array.from({ length: count }, (_, index) => first + index);
}

export function tierName(upgrade: Upgrade, tier: number): string {
    if (upgrade === 'plow') {
        return tier === 0 ? 'Без ковша' : 'Ковш';
    }

    return tier === 0 ? 'Базовая деталь' : `Уровень ${ tier }`;
}

function tierStatus(props: TierProps, current: number, cost: number): string {
    const { tier, isBusy, upgrade } = props;

    if (upgrade === 'plow' && tier === 0) {
        return 'Без ковша';
    }

    if (tier === current) {
        return 'Установлено';
    }

    if (tier < current) {
        return 'Куплено';
    }

    if (tier === current + 1) {
        if (isBusy) {
            return 'Установка…';
        }

        if (props.progress.balance < cost) {
            return 'Не хватает денег';
        }

        return upgrade === 'plow' ? 'Установить' : 'Купить';
    }

    return 'Сначала предыдущий';
}
