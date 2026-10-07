const pad = (n: number) => String(n).padStart(2, "0");

/** Local calendar day as YYYY-MM-DD. */
export function dayKey(d: Date): string {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export interface DayCell {
    key: string;
    date: Date;
    inMonth: boolean;
}

/** Whole weeks (Monday first) covering the given month; `month` is 0-based. */
export function monthGrid(year: number, month: number): DayCell[] {
    const first = new Date(year, month, 1);
    const offset = (first.getDay() + 6) % 7; // Monday = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const weeks = Math.ceil((offset + daysInMonth) / 7);
    const cells: DayCell[] = [];
    for (let i = 0; i < weeks * 7; i++) {
        const date = new Date(year, month, 1 - offset + i);
        cells.push({ key: dayKey(date), date, inMonth: date.getMonth() === month });
    }
    return cells;
}
