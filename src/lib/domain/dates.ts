/** 'YYYY-MM-DD' -> Date at midnight UTC; undefined stays undefined (unchanged), ""/null clear the value. */
export function dateOnly(value: string | null | undefined): Date | null | undefined {
    if (value === undefined) return undefined;
    if (value === null || value === "") return null;
    return new Date(`${value}T00:00:00.000Z`);
}
