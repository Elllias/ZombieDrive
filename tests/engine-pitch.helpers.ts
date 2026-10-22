const SAMPLE_RATE = 22050;
const MINIMUM_LAG = Math.floor(SAMPLE_RATE / 70);
const MAXIMUM_LAG = Math.ceil(SAMPLE_RATE / 35);

export function enginePitch(samples: ReadonlyArray<number>): number {
    let bestLag = MINIMUM_LAG;
    let bestScore = -1;

    for (let lag = MINIMUM_LAG; lag <= MAXIMUM_LAG; lag += 1) {
        const score = correlation(samples, lag);

        if (score > bestScore) {
            bestScore = score;
            bestLag = lag;
        }
    }

    return SAMPLE_RATE / bestLag;
}

function correlation(samples: ReadonlyArray<number>, lag: number): number {
    let product = 0;
    let leftPower = 0;
    let rightPower = 0;

    for (let index = lag; index < samples.length; index += 1) {
        const left = samples[index - lag] ?? 0;
        const right = samples[index] ?? 0;

        product += left * right;
        leftPower += left * left;
        rightPower += right * right;
    }

    return product / Math.sqrt(leftPower * rightPower);
}
