import { ARTWORK_LOAD_TIMEOUT_MS } from '../configs/artwork';

const images = new Map<string, Promise<HTMLImageElement>>();

export function preloadImage(source: string, priority: 'high' | 'low' = 'high'): Promise<HTMLImageElement> {
    const cached = images.get(source);

    if (cached) {
        return cached;
    }

    const pending = decodeImage(source, priority).catch((error: unknown): never => {
        images.delete(source);

        throw error;
    });

    images.set(source, pending);

    return pending;
}

function decodeImage(source: string, priority: 'high' | 'low'): Promise<HTMLImageElement> {
    return new Promise((resolve, reject): void => {
        const image = new Image();
        const failure = new Error('Не удалось загрузить графику. Проверь подключение и попробуй ещё раз.');

        const timeout = setTimeout((): void => {
            image.removeAttribute('src');
            reject(failure);
        }, ARTWORK_LOAD_TIMEOUT_MS);

        image.decoding = 'async';
        image.fetchPriority = priority;
        image.src = source;

        void image.decode().then((): void => {
            resolve(image);
        }, (): void => {
            reject(failure);
        }).finally((): void => clearTimeout(timeout));
    });
}
