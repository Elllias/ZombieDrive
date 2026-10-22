import type { ReactElement } from 'react';

import type { AppController } from '../state/useAppController';
import type { AppState } from '../state/types';
import type { AppActions } from '../state/AppActions';

import { Garage } from './garage/Garage';
import { RunScreen } from './run/RunScreen';
import { ResultScreen } from './result/ResultScreen';

type ScreenProps<Screen extends AppState['screen']> = {
    state: Extract<AppState, { screen: Screen }>;
    actions: AppActions;
};

export function App({ state, actions }: AppController): ReactElement {
    if (state.screen === 'loading') {
        return <LoadingScreen />;
    }

    if (state.screen === 'error') {
        return <ErrorScreen state={state} actions={actions} />;
    }

    if (state.screen === 'garage') {
        return <GarageScreen state={state} actions={actions} />;
    }

    return <RunView state={state} actions={actions} />;
}

function LoadingScreen(): ReactElement {
    return (
        <main className="status-screen">
            <span className="brand-mark">ZD</span>
            <p role="status">Открываем гараж…</p>
        </main>
    );
}

function ErrorScreen({ state, actions }: ScreenProps<'error'>): ReactElement {
    return (
        <main className="status-screen">
            <h1>Не удалось открыть гараж</h1>

            <p className="error" role="alert">
                {state.message}
            </p>

            <button
                className="primary"
                onClick={() => {
                    void actions.load();
                }}
            >
                Повторить
            </button>
        </main>
    );
}

function GarageScreen({ state, actions }: ScreenProps<'garage'>): ReactElement {
    return (
        <Garage
            {...state}
            onStart={() => {
                void actions.start(state);
            }}
            onBuy={(upgrade) => {
                void actions.buy(state, upgrade);
            }}
            onSelectStage={(stageId) => {
                void actions.selectStage(state, stageId);
            }}
            onAbandon={() => {
                void actions.abandonActive(state);
            }}
        />
    );
}

function RunView({ state, actions }: ScreenProps<'run' | 'result'>): ReactElement {
    return (
        <RunScreen
            key={state.run.id}
            run={state.run}
            showInstructions={state.screen === 'run' && state.progress.bestDistance < 1}
            initialReport={state.screen === 'result' ? state.report : undefined}
            onFinish={(report) => {
                if (state.screen === 'run') {
                    void actions.finish(state.run, report);
                }
            }}
        >
            {state.screen === 'result' && <RunResult state={state} actions={actions} />}
        </RunScreen>
    );
}

function RunResult({ state, actions }: ScreenProps<'result'>): ReactElement {
    return (
        <ResultScreen
            {...state}
            onRetry={() => {
                void actions.finish(state.run, state.report);
            }}
            onGarage={() => { void actions.garage(state); }}
            onDiscard={() => { void actions.discardResult(state); }}
        />
    );
}
