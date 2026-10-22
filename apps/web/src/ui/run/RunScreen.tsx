import type { ReactElement, ReactNode } from 'react';

import type { Run } from '@zombie-drive/shared';

import { useRunSession, type RunSessionOptions } from './useRunSession';
import { GameViewport } from './GameViewport';
import { RunHud } from './RunHud';
import { RunControls } from './RunControls';
import { PauseOverlay } from './PauseOverlay';

interface RunScreenProps extends RunSessionOptions {
    run: Run;
    children?: ReactNode;
}

type RunSession = ReturnType<typeof useRunSession>;

export function RunScreen(props: RunScreenProps): ReactElement {
    const session = useRunSession(props);
    const { bridge, input, snapshot, onError } = session;

    return (
        <main className="game-shell run-screen">
            <GameViewport run={props.run} bridge={bridge} onError={onError} />

            <RunHud
                snapshot={snapshot} stageId={props.run.stageId}
                onPause={() => {
                    input.clear();
                    bridge.pause();
                }}
            />

            {!snapshot.report && (
                <div inert={snapshot.isPaused}>
                    <RunControls input={input} />
                </div>
            )}

            {snapshot.isPaused && !snapshot.report && (
                <RunPause session={session} showInstructions={props.showInstructions} />
            )}

            {props.children}
        </main>
    );
}

function RunPause(props: { session: RunSession; showInstructions?: boolean }): ReactElement {
    const { bridge, snapshot, error } = props.session;

    return (
        <PauseOverlay
            error={error}
            isIntroduction={snapshot.elapsed === 0 && props.showInstructions}
            onResume={() => {
                if (window.innerWidth >= window.innerHeight && !error) {
                    bridge.resume();
                }
            }}
            onAbandon={() => bridge.abandon()}
        />
    );
}
