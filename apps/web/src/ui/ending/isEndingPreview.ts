export function isEndingPreview(search: string): boolean {
    return new URLSearchParams(search).get('scene') === 'ending';
}
