export function isConnectionError(error: unknown): boolean {
    return typeof error === 'object'
        && error !== null
        && 'name' in error
        && typeof error.name === 'string'
        && [ 'AbortError', 'TimeoutError', 'TypeError' ].includes(error.name);
}
