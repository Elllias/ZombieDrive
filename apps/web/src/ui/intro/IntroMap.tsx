import type { ReactElement } from 'react';

import { INTRO_COPY } from '../../configs/scenes/intro';

import { MapIllustration } from '../map/MapIllustration';

export function IntroMap(): ReactElement {
    return (
        <div className="intro-route paper-map">
            <MapIllustration isIntro />
            <span className="intro-map-stamp">{INTRO_COPY.mapStamp}</span>
        </div>
    );
}
