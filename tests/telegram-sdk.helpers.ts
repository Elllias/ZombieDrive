import { vi } from 'vitest';

import type {} from '../apps/web/src/platform/telegram';

type WebApp = NonNullable<NonNullable<Window['Telegram']>['WebApp']>;

export class SdkScript extends EventTarget {
    id = '';
    src = '';
    async = false;
    isRemoved = false;

    remove(): void {
        this.isRemoved = true;
    }
}

export function browser(): Array<SdkScript> {
    const scripts: Array<SdkScript> = [];
    const target = Object.assign(new EventTarget(), { innerWidth: 915, innerHeight: 412 });

    const document = Object.assign(new EventTarget(), {
        hidden: false,
        createElement: (): SdkScript => new SdkScript(),
        head: { append: (script: SdkScript): void => { scripts.push(script); } },
    });

    vi.stubGlobal('window', target);
    vi.stubGlobal('document', document);

    return scripts;
}

export function scriptAt(scripts: ReadonlyArray<SdkScript>, index = 0): SdkScript {
    const script = scripts[index];

    if (!script) {
        throw new Error('SDK script was not appended');
    }

    return script;
}

export function sdk(): WebApp {
    return {
        ready: vi.fn<WebApp['ready']>(),
        expand: vi.fn<WebApp['expand']>(),
        setHeaderColor: vi.fn<WebApp['setHeaderColor']>(),
        setBackgroundColor: vi.fn<WebApp['setBackgroundColor']>(),
        isVersionAtLeast: vi.fn<WebApp['isVersionAtLeast']>().mockReturnValue(true),

        BackButton: {
            show: vi.fn<WebApp['BackButton']['show']>(),
            hide: vi.fn<WebApp['BackButton']['hide']>(),
            onClick: vi.fn<WebApp['BackButton']['onClick']>(),
            offClick: vi.fn<WebApp['BackButton']['offClick']>(),
        },

        onEvent: vi.fn<WebApp['onEvent']>(),
        offEvent: vi.fn<WebApp['offEvent']>(),
    };
}
