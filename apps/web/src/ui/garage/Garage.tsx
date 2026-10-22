import { useState, type ReactElement } from 'react';

import { stageConfig, vehicleConfig, type Progress, type Upgrade, type StageId } from '@zombie-drive/shared';

import { SoundButton } from '../common/SoundButton';
import { HapticsButton } from '../common/HapticsButton';
import { Vehicle } from '../common/Vehicle';
import { GameOverlay } from '../common/GameOverlay';
import { MapDialog } from '../map/MapDialog';
import { MapIcon } from '../common/MapIcon';

import { UpgradeCard } from './UpgradeCard';
import { UpgradeDialog } from './UpgradeDialog';
import { usePurchaseSound } from './usePurchaseSound';

interface GarageProps {
    progress: Progress;
    isBusy: boolean;
    error: string | null;
    onStart: () => void;
    onBuy: (upgrade: Upgrade) => void;
    onAbandon: () => void;
    onSelectStage: (stageId: StageId) => void;
}

export function Garage(props: GarageProps): ReactElement {
    const [ upgrade, setUpgrade ] = useState<Upgrade | null>(null);
    const [ isMapOpen, setMapOpen ] = useState(false);
    const stage = stageConfig(props.progress.stageId);

    usePurchaseSound(props.progress.balance);

    return (
        <main className={`game-shell garage ${ stage.vehicleId }-garage`}>
            <GarageToolbar {...props} onMap={() => setMapOpen(true)} />
            <GarageScene progress={props.progress} />
            <UpgradeRack progress={props.progress} onSelect={setUpgrade} />

            {props.error && !upgrade && (
                <p className="garage-notice error" role="alert">
                    {props.error}
                </p>
            )}

            {upgrade && <UpgradeDialog {...props} upgrade={upgrade} onClose={() => setUpgrade(null)} />}

            {isMapOpen && (
                <MapDialog progress={props.progress} isBusy={props.isBusy}
                    onSelect={props.onSelectStage} onClose={() => setMapOpen(false)} />
            )}

            {props.progress.activeRun && <InterruptedRun {...props} />}
        </main>
    );
}

function GarageScene({ progress }: Pick<GarageProps, 'progress'>): ReactElement {
    const stage = stageConfig(progress.stageId);

    return (
        <section className="garage-scene" aria-label="Мастерская">
            <GarageSign progress={progress} />

            <div className="garage-tools">
                <SoundButton />
                <HapticsButton />
            </div>

            <div className="garage-vehicle">
                <Vehicle tireLevel={progress.upgrades.tires} vehicleId={stage.vehicleId}
                    plowLevel={progress.upgrades.plow ?? 0} />
            </div>

            <div className="garage-record">Рекорд: {Math.floor(progress.bestDistance)} м</div>
        </section>
    );
}

function GarageSign({ progress }: Pick<GarageProps, 'progress'>): ReactElement {
    const stage = stageConfig(progress.stageId);
    const isCompleted = progress.stages?.some((saved) => saved.stageId === stage.id && saved.completed);

    return (
        <div className="garage-sign">
            {stage.title.toUpperCase()}<span>{stage.track.length} М ДО ВЫХОДА</span>
            {isCompleted && <span>Этап пройден · заезды без награды</span>}
        </div>
    );
}

function UpgradeRack(props: { progress: Progress; onSelect: (upgrade: Upgrade) => void }): ReactElement {
    const upgrades = vehicleConfig(stageConfig(props.progress.stageId).vehicleId).upgrades;

    return (
        <nav className="upgrade-rack" aria-label="Улучшения машины">
            {upgrades.map((item) => (
                <UpgradeCard key={item} upgrade={item} progress={props.progress} onSelect={props.onSelect} />
            ))}
        </nav>
    );
}

function GarageToolbar(props: GarageProps & { onMap: () => void }): ReactElement {
    return (
        <header className="garage-toolbar">
            <button className="game-button map-button" onClick={props.onMap} aria-label="Карта пути">
                <span className="map-label">Карта</span>
                <MapIcon />
            </button>

            <h1 className="outlined orange">Гараж</h1>

            <strong className="garage-cash outlined" aria-label={`Баланс $${ props.progress.balance }`}>
                ${props.progress.balance.toLocaleString('ru-RU')}
            </strong>

            <button
                className="game-button drive-button"
                disabled={props.isBusy || props.progress.activeRun !== null}
                onClick={props.onStart}
            >
                {props.isBusy ? '…' : 'В путь!'}
            </button>
        </header>
    );
}

function InterruptedRun(props: GarageProps): ReactElement {
    return (
        <GameOverlay title="Незавершённый заезд">
            <section className="metal-panel interrupted-panel">
                <h2 className="orange outlined">Заезд прерван</h2>
                <p>Прошлый заезд остался незавершённым.</p>

                {props.error && (
                    <p className="error" role="alert">
                        {props.error}
                    </p>
                )}

                <button className="game-button" disabled={props.isBusy} onClick={props.onAbandon}>
                    Завершить без награды
                </button>
            </section>
        </GameOverlay>
    );
}
