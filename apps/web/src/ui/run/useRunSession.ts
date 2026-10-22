import { useCallback, useMemo, useState, useSyncExternalStore } from 'react';

import type { RunReport } from '@zombie-drive/shared';

import type { GameBridge, GameSnapshot } from '../../game/GameBridge';

import { createBridge } from './RunScreen.utils';
import { useFinishReport } from './useFinishReport';
import { InputController } from './InputController';
import { useRunLifecycle } from './useRunLifecycle';

export interface RunSessionOptions {
    initialReport?: RunReport;
    showInstructions?: boolean;
    onFinish: (report: RunReport) => void;
}

interface RunSession {
    bridge: GameBridge;
    input: InputController;
    snapshot: GameSnapshot;
    error: string | null;
    onError: (message: string) => void;
}

export function useRunSession(props: RunSessionOptions): RunSession {
    const bridge = useMemo(() => createBridge(props.initialReport, props.showInstructions), []);
    const input = useMemo(() => new InputController(bridge), [ bridge ]);
    const snapshot = useSyncExternalStore(bridge.subscribe, bridge.getSnapshot);
    const [ error, setError ] = useState<string | null>(null);

    const onError = useCallback(
        (message: string): void => {
            setError(message);
            bridge.pauseForError();
        },
        [ bridge ],
    );

    useRunLifecycle(bridge, input);
    useFinishReport(snapshot.report, props.onFinish, props.initialReport !== undefined);

    return { bridge, input, snapshot, error, onError };
}
