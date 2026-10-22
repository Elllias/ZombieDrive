import type { ReactElement } from 'react';

export function Gauge(props: { kind: 'speed' | 'fuel'; value: number }): ReactElement {
    const isSpeed = props.kind === 'speed';
    const maximum = isSpeed ? 100 : 1;
    const angle = -125 + Math.min(1, Math.max(0, props.value / maximum)) * 250;

    return (
        <div
            className={`gauge gauge-${ props.kind }`}
            role="meter"
            aria-label={isSpeed ? 'Скорость' : 'Топливо'}
            aria-valuemin={0}
            aria-valuemax={maximum}
            aria-valuenow={Math.min(maximum, props.value)}
            aria-valuetext={isSpeed ? `${ Math.round(props.value) } км/ч` : `${ Math.round(props.value * 100) }%`}
        >
            <GaugeDial {...props} isSpeed={isSpeed} angle={angle} />
        </div>
    );
}

function GaugeDial(props: { isSpeed: boolean; value: number; angle: number }): ReactElement {
    const { isSpeed, angle } = props;

    return (
        <svg viewBox="0 0 160 160" aria-hidden="true">
            <circle className="dial-rim" cx="80" cy="80" r="76" />
            <circle className="dial-face" cx="80" cy="80" r="66" />
            <DialTicks />
            <DialNumbers isSpeed={isSpeed} />

            <text className="dial-unit" x="80" y="60">
                {isSpeed ? 'км/ч' : 'ТОПЛИВО'}
            </text>

            <g transform={`rotate(${ angle } 80 80)`}>
                <path className="dial-needle" d="M77 88 80 27 83 88Z" />
            </g>

            <circle className="dial-center" cx="80" cy="80" r="11" />

            <text className="dial-value" x="80" y="122">
                {Math.round(props.value * (isSpeed ? 1 : 100))}
                {isSpeed ? '' : '%'}
            </text>
        </svg>
    );
}

function DialTicks(): ReactElement {
    return (
        <>
            {Array.from({ length: 21 }, (_, index) => (
                <line
                    key={index}
                    className="dial-tick"
                    x1="80"
                    x2="80"
                    y1="21"
                    y2={index % 4 === 0 ? '34' : '28'}
                    transform={`rotate(${ -125 + index * 12.5 } 80 80)`}
                />
            ))}
        </>
    );
}

function DialNumbers({ isSpeed }: { isSpeed: boolean }): ReactElement {
    return (
        <>
            {[ 0, 1, 2, 3, 4, 5 ].map((index) => (
                <text
                    key={index}
                    className="dial-number"
                    x={80 + Math.sin(((-125 + index * 50) * Math.PI) / 180) * 46}
                    y={84 - Math.cos(((-125 + index * 50) * Math.PI) / 180) * 46}
                >
                    {isSpeed
                        ? index * 20
                        : index === 0
                            ? 'E'
                            : index === 5
                                ? 'F'
                                : '·'}
                </text>
            ))}
        </>
    );
}
