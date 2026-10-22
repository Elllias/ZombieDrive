import type { Progress, Upgrade, VehicleId } from '@zombie-drive/shared';

export interface UpgradeProps {
    upgrade: Upgrade;
    progress: Progress;
    isBusy: boolean;
    error: string | null;
    onBuy: (upgrade: Upgrade) => void;
    onClose: () => void;
}

export type TierProps = UpgradeProps & { tier: number };

export type TierArtProps = Pick<TierProps, 'upgrade' | 'tier'> & { vehicleId: VehicleId };
