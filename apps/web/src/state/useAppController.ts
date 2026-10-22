import { useEffect, useMemo, useState } from 'react';

import { API } from '../api/client';

import { AppActions } from './AppActions';
import type { AppState } from './types';

export interface AppController {
    state: AppState;
    actions: AppActions;
}

export function useAppController(): AppController {
    const [ state, setState ] = useState<AppState>({ screen: 'loading' });
    const actions = useMemo(() => new AppActions(API, setState), []);

    useEffect(() => {
        let isCurrent = true;

        void actions.load((): boolean => isCurrent);

        return (): void => {
            isCurrent = false;
        };
    }, [ actions ]);

    return { state, actions };
}
