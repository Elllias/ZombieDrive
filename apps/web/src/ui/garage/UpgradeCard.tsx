import type { ReactElement } from 'react';

import { stageConfig, upgradeCost, upgradeMaxLevel, type Upgrade, type Progress } from '@zombie-drive/shared';

import { PartIcon } from '../common/PartIcon';
import { LevelTrack } from '../common/LevelTrack';

import { UPGRADE_DETAILS } from '../../configs/upgrades';
import { upgradeCardPrice } from './UpgradeCard.utils';

export function UpgradeCard(props: {
    upgrade: Upgrade;
    progress: Progress;
    onSelect: (upgrade: Upgrade) => void;
}): ReactElement {
    const level = (props.progress.upgrades[props.upgrade] ?? 0);

    const cost = upgradeCost(props.upgrade, level, stageConfig(props.progress.stageId).vehicleId);
    const title = level < upgradeMaxLevel(props.upgrade) ? `$${ cost.toLocaleString('ru-RU') }` : undefined;

    return (
        <button className="upgrade-card" title={title} onClick={() => props.onSelect(props.upgrade)}>
            <span className={`upgrade-price upgrade-price-${ props.upgrade }`}>
                {upgradeCardPrice(props.progress, props.upgrade)}
            </span>

            <PartIcon upgrade={props.upgrade} level={level}
                vehicleId={stageConfig(props.progress.stageId).vehicleId} />

            <span className="upgrade-name">{UPGRADE_DETAILS[props.upgrade].title}</span>
            <LevelTrack level={level} maximum={upgradeMaxLevel(props.upgrade)} />
        </button>
    );
}
