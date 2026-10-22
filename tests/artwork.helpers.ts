export function pendingArtwork(): {
    ready: Promise<void>;
    complete: () => void;
    fail: (error: unknown) => void;
    } {
    let complete = (): void => {};
    let fail: (error: unknown) => void = (): void => {};

    const ready = new Promise<void>((resolve, reject): void => {
        complete = resolve;
        fail = reject;
    });

    return { ready, complete, fail };
}
