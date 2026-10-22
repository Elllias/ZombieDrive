import { upgradeCost, upgradeMaxLevel, stageConfig, type Progress, type Upgrade } from '@zombie-drive/shared';

import { formatPrice } from '../common/formatPrice';

export function upgradeCardPrice(progress: Progress, upgrade: Upgrade): string {
    const level = progress.upgrades[upgrade] ?? 0;

    if (level >= upgradeMaxLevel(upgrade)) {
        return upgrade === 'plow' ? 'Установлен' : 'MAX';
    }

    return formatPrice(upgradeCost(upgrade, level, stageConfig(progress.stageId).vehicleId));
}
