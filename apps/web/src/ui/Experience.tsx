import type { ReactElement } from 'react';

import { GameExperience } from './GameExperience';
import { EndingPreview } from './ending/EndingPreview';
import { isEndingPreview } from './ending/isEndingPreview';

export function Experience(): ReactElement {
    return isEndingPreview(window.location.search) ? <EndingPreview /> : <GameExperience />;
}
