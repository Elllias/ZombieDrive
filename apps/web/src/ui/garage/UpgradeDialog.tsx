import type { ReactElement } from 'react';

import { stageConfig, upgradeMaxLevel } from '@zombie-drive/shared';

import { formatPrice } from '../common/formatPrice';
import { GameDialog } from '../common/GameDialog';
import { PartIcon } from '../common/PartIcon';
import { LevelTrack } from '../common/LevelTrack';
import { LockIcon } from '../common/LockIcon';

import { UPGRADE_DETAILS } from '../../configs/upgrades';
import { tierAvailability, tierName, upgradeTiers } from './UpgradeDialog.utils';
import type { UpgradeProps, TierProps, TierArtProps } from './UpgradeDialog.types';

export function UpgradeDialog(props: UpgradeProps): ReactElement {
    const level = (props.progress.upgrades[props.upgrade] ?? 0);
    const tiers = upgradeTiers(props.upgrade, level);

    return (
        <GameDialog title={UPGRADE_DETAILS[props.upgrade].title} onClose={props.onClose}>
            <p className="upgrade-description">{UPGRADE_DETAILS[props.upgrade].description}</p>

            <div className={`upgrade-tiers upgrade-tiers-${ tiers.length }`}>
                {tiers.map((tier) => (
                    <UpgradeTier key={tier} {...props} tier={tier} />
                ))}
            </div>

            {props.error && (
                <p className="error" role="alert">
                    {props.error}
                </p>
            )}

            <button className="game-button dialog-ok" onClick={props.onClose}>
                Готово
            </button>
        </GameDialog>
    );
}

function UpgradeTier(props: TierProps): ReactElement {
    const level = (props.progress.upgrades[props.upgrade] ?? 0);
    const { cost, disabled, label, status } = tierAvailability(props);

    return (
        <button
            className={`upgrade-tier ${ props.tier === level ? 'installed' : '' }`}
            disabled={disabled}
            onClick={() => props.onBuy(props.upgrade)}
            aria-label={label}
        >
            <span className="tier-status">{status}</span>

            <TierArt upgrade={props.upgrade} tier={props.tier}
                vehicleId={stageConfig(props.progress.stageId).vehicleId} />

            {props.tier > level && <LockIcon />}

            <strong className="tier-price" title={`$${ cost.toLocaleString('ru-RU') }`}>
                {props.tier > level ? formatPrice(cost) : ''}
            </strong>

            <span className="tier-level">
                {tierName(props.upgrade, props.tier)}
            </span>

            <LevelTrack level={props.tier} maximum={upgradeMaxLevel(props.upgrade)} />
        </button>
    );
}

function TierArt({ upgrade, tier, vehicleId }: TierArtProps): ReactElement {
    if (upgrade === 'plow' && tier === 0) {
        return <span className="part-icon absent-part" aria-hidden="true">—</span>;
    }

    return <PartIcon upgrade={upgrade} level={tier} vehicleId={vehicleId} />;
}
