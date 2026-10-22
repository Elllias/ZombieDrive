import type { ReactElement } from 'react';

import { GameOverlay } from '../common/GameOverlay';
import { SoundButton } from '../common/SoundButton';
import { HapticsButton } from '../common/HapticsButton';

interface PauseProps {
    onResume: () => void;
    onAbandon: () => void;
    error: string | null;
    isIntroduction?: boolean;
}

export function PauseOverlay(props: PauseProps): ReactElement {
    return (
        <GameOverlay title={props.isIntroduction ? 'Управление машиной' : 'Заезд приостановлен'}>
            <div className="metal-panel pause-card">
                <h2 className="orange outlined">{props.isIntroduction ? 'Управление' : 'Пауза'}</h2>
                <OrientationHint />

                {props.error && (
                    <p className="error" role="alert">
                        {props.error}
                    </p>
                )}

                <ControlHints />
                <PauseActions {...props} />

                <div className="feedback-settings">
                    <SoundButton />
                    <HapticsButton />
                </div>
            </div>
        </GameOverlay>
    );
}

function OrientationHint(): ReactElement {
    return (
        <p className="portrait-hint">
            Поверни устройство горизонтально,
            <br />
            чтобы продолжить заезд.
        </p>
    );
}

function PauseActions(props: Pick<PauseProps, 'onResume' | 'onAbandon' | 'isIntroduction' | 'error'>): ReactElement {
    return (
        <>
            <button className="game-button resume-button" disabled={Boolean(props.error)} autoFocus onClick={props.onResume}>
                {props.isIntroduction ? 'Поехали!' : 'Продолжить'}
            </button>

            <button className="game-button" onClick={props.onAbandon}>
                В гараж без награды
            </button>
        </>
    );
}

function ControlHints(): ReactElement {
    return (
        <>
            <p className="controls-hint">
                Удерживай ГАЗ для разгона.
                <br />↶ / ↷ — наклон машины.
                <br />
                ТОРМОЗ — остановка, затем задний ход.
                <br />В яме откати назад и разгонись снова.
            </p>
        </>
    );
}
