import type { ReactElement } from 'react';

import {
    stageConfig,
    type Run,
    type RunReport,
    type Settlement,
} from '@zombie-drive/shared';

import { GameOverlay } from '../common/GameOverlay';

import { REASON_LABELS } from '../../configs/results';

interface ResultProps {
    report: RunReport;
    run: Run;
    settlement: Settlement | null;
    isBusy: boolean;
    error: string | null;
    canDiscard: boolean;
    onRetry: () => void;
    onGarage: () => void;
    onDiscard: () => void;
}

export function ResultScreen(props: ResultProps): ReactElement {
    return (
        <GameOverlay title="Итоги заезда" className="result-screen">
            <section className="metal-panel result-card">
                <h1 className="orange outlined">
                    {props.report.reason === 'finish' ? 'Финиш!' : 'Заезд окончен'}
                </h1>

                <p className="result-reason">{REASON_LABELS[props.report.reason]}</p>
                <ResultSummary report={props.report} settlement={props.settlement} run={props.run} />
                <ResultActions {...props} />
            </section>
        </GameOverlay>
    );
}

function ResultSummary(props: Pick<ResultProps, 'report' | 'settlement' | 'run'>): ReactElement {
    return (
        <>
            <progress
                className="result-progress"
                value={props.report.distance}
                max={stageConfig(props.run.stageId).track.length}
                aria-label="Пройденная часть трассы"
            />

            <div className="result-row">
                <span>Дистанция</span>
                <strong>{Math.floor(props.report.distance)} м</strong>
            </div>

            <div className="result-row">
                <span>Убито зомби</span>
                <strong>{props.report.killedZombieIds.length}</strong>
            </div>

            <div className="result-row result-total">
                <span>Заработано</span>
                <strong>{props.settlement ? `$${ props.settlement.reward.toLocaleString('ru-RU') }` : '…'}</strong>
            </div>
        </>
    );
}

function ResultActions(props: ResultProps): ReactElement {
    return (
        <footer className="result-actions">
            <p role="status">{settlementStatus(props)}</p>

            {props.error && (
                <p className="error" role="alert">
                    {props.error}
                </p>
            )}

            <ResultButtons {...props} />
        </footer>
    );
}

function ResultButtons(props: ResultProps): ReactElement {
    return (
        <div className="result-buttons">
            <SettlementButton {...props} />

            {props.canDiscard && !props.settlement && (
                <button className="game-button" disabled={props.isBusy} onClick={props.onDiscard}>
                    В гараж без награды
                </button>
            )}
        </div>
    );
}

function SettlementButton(props: ResultProps): ReactElement {
    if (props.settlement) {
        return <button className="game-button" autoFocus disabled={props.isBusy} onClick={props.onGarage}>В гараж</button>;
    }

    return (
        <button className="game-button" disabled={props.isBusy} onClick={props.onRetry}>
            {props.isBusy ? 'Сохраняем…' : 'Повторить отправку'}
        </button>
    );
}

function settlementStatus(props: Pick<ResultProps, 'settlement' | 'isBusy'>): string {
    if (props.settlement) {
        return props.isBusy ? 'Открываем гараж…' : 'Прогресс сохранён';
    }

    return props.isBusy ? 'Сохраняем результат…' : 'Результат ещё не сохранён';
}
