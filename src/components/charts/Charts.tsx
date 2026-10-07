"use client";
import { useState } from "react";

export interface Datum {
    label: string;
    value: number;
    href?: string;
}

function DataTableView({ data, valueLabel, labelHeader }: { data: Datum[]; valueLabel: string; labelHeader: string }) {
    return (
        <details className="mt-3 text-sm">
            <summary className="link link-hover muted cursor-pointer">View as table</summary>
            <table className="table table-xs mt-2">
                <thead>
                    <tr>
                        <th scope="col">{labelHeader}</th>
                        <th scope="col" className="text-right">
                            {valueLabel}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((d) => (
                        <tr key={d.label}>
                            <td>{d.label}</td>
                            <td className="text-right tabular-nums">{d.value}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </details>
    );
}

/** Horizontal bars, one hue, sorted by the caller. Values are labelled directly (no legend needed for one series). */
export function BarList({
    data,
    valueLabel,
    labelHeader,
    emptyText = "No data yet",
}: {
    data: Datum[];
    valueLabel: string;
    labelHeader: string;
    emptyText?: string;
}) {
    if (!data.length) return <p className="muted py-8 text-center text-sm">{emptyText}</p>;
    const max = Math.max(...data.map((d) => d.value), 1);
    return (
        <div>
            <ul className="flex flex-col gap-2.5" role="list">
                {data.map((d) => (
                    <li key={d.label} className="grid grid-cols-[minmax(0,7.5rem)_1fr_2.5rem] items-center gap-3 text-sm sm:grid-cols-[9rem_1fr_2.5rem]">
                        <span className="truncate" title={d.label}>
                            {d.label}
                        </span>
                        <span className="bg-base-200 h-3 overflow-hidden rounded-full" aria-hidden>
                            <span className="bar-fill block h-full rounded-full" style={{ width: `${Math.max(3, (d.value / max) * 100)}%` }} />
                        </span>
                        <span className="text-right font-medium tabular-nums">{d.value}</span>
                    </li>
                ))}
            </ul>
            <DataTableView data={data} valueLabel={valueLabel} labelHeader={labelHeader} />
        </div>
    );
}

/** Vertical columns over a baseline, for ordered categories such as years. Hover or focus a column for its value. */
export function ColumnChart({
    data,
    valueLabel,
    labelHeader,
    emptyText = "No data yet",
}: {
    data: Datum[];
    valueLabel: string;
    labelHeader: string;
    emptyText?: string;
}) {
    const [active, setActive] = useState<number | null>(null);
    if (!data.length) return <p className="muted py-8 text-center text-sm">{emptyText}</p>;
    const max = Math.max(...data.map((d) => d.value), 1);
    const H = 160;
    const step = 100 / data.length;
    const every = Math.ceil(data.length / 8);
    const ticks = [0, Math.ceil(max / 2), max];

    return (
        <div>
            <div className="relative">
                <svg viewBox={`0 0 100 ${H + 18}`} preserveAspectRatio="none" className="h-52 w-full overflow-visible" role="img" aria-label={`${valueLabel} by ${labelHeader.toLowerCase()}`}>
                    {ticks.map((t) => (
                        <line
                            key={t}
                            x1="0"
                            x2="100"
                            y1={H - (t / max) * H}
                            y2={H - (t / max) * H}
                            stroke="currentColor"
                            strokeOpacity={t === 0 ? 0.35 : 0.12}
                            strokeWidth="0.4"
                            vectorEffect="non-scaling-stroke"
                        />
                    ))}
                    {data.map((d, i) => {
                        const h = (d.value / max) * H;
                        const w = Math.max(step * 0.62, 0.4);
                        return (
                            <g key={d.label}>
                                <rect
                                    x={i * step + (step - w) / 2}
                                    y={H - h}
                                    width={w}
                                    height={Math.max(h, d.value ? 0.8 : 0)}
                                    rx="0.6"
                                    fill="var(--color-primary)"
                                    opacity={active === null || active === i ? 1 : 0.45}
                                />
                                <rect
                                    x={i * step}
                                    y="0"
                                    width={step}
                                    height={H}
                                    fill="transparent"
                                    tabIndex={0}
                                    role="img"
                                    aria-label={`${d.label}: ${d.value}`}
                                    onMouseEnter={() => setActive(i)}
                                    onMouseLeave={() => setActive(null)}
                                    onFocus={() => setActive(i)}
                                    onBlur={() => setActive(null)}
                                />
                            </g>
                        );
                    })}
                </svg>
                <div className="muted pointer-events-none absolute inset-x-0 bottom-0 flex text-[11px]" aria-hidden>
                    {data.map((d, i) => (
                        <span key={d.label} className="text-center" style={{ width: `${step}%` }}>
                            {i % every === 0 ? d.label : ""}
                        </span>
                    ))}
                </div>
                {active !== null && (
                    <div
                        className="bg-neutral text-neutral-content pointer-events-none absolute z-10 -translate-x-1/2 rounded-lg px-2.5 py-1.5 text-xs shadow-lg"
                        style={{ left: `${(active + 0.5) * step}%`, top: 0 }}
                        role="status"
                    >
                        <strong>{data[active].label}</strong>: {data[active].value} {valueLabel.toLowerCase()}
                    </div>
                )}
            </div>
            <DataTableView data={data} valueLabel={valueLabel} labelHeader={labelHeader} />
        </div>
    );
}
