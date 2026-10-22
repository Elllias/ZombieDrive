export function formatPrice(amount: number): string {
    return `$${ amount.toLocaleString('ru-RU', {
        notation: amount >= 1_000_000 ? 'compact' : 'standard',
        maximumFractionDigits: 2,
    }) }`;
}
