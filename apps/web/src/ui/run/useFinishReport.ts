import { useEffect, useRef } from 'react';

import type { RunReport } from '@zombie-drive/shared';

export function useFinishReport(
    report: RunReport | null,
    onFinish: (report: RunReport) => void,
    isRestored: boolean,
): void {
    const hasSent = useRef(isRestored);

    useEffect(() => {
        if (!report || hasSent.current) {
            return;
        }

        hasSent.current = true;
        onFinish(report);
    }, [ report, onFinish ]);
}
