import type { Progress, Run, RunReport, Settlement } from '@zombie-drive/shared';

export type AppState =
    | { screen: 'loading' }
    | { screen: 'error'; message: string }
    | { screen: 'garage'; progress: Progress; isBusy: boolean; error: string | null }
    | { screen: 'run'; progress: Progress; run: Run }
    | {
          screen: 'result';
          run: Run;
          report: RunReport;
          settlement: Settlement | null;
          isBusy: boolean;
          error: string | null;
          canDiscard: boolean;
      };

export type SetAppState = (state: AppState) => void;
export type GarageState = Extract<AppState, { screen: 'garage' }>;
export type ResultState = Extract<AppState, { screen: 'result' }>;
