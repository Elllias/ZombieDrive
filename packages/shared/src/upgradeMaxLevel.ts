import { GAME_CONFIG } from './configs/game';
import type { Upgrade } from './schemas';

export function upgradeMaxLevel(upgrade: Upgrade): number {
    return upgrade === 'plow' ? 1 : GAME_CONFIG.economy.maxLevel;
}
