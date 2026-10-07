/** "3:42" -> 222, "222" -> 222, "1:02:03" -> 3723. Returns null when the text is not a duration. */
export function parseDuration(input: string): number | null {
    const text = input.trim();
    if (!text) return null;
    if (/^\d+$/.test(text)) return Number(text);
    const m = /^(?:(\d+):)?(\d{1,2}):(\d{2})$/.exec(text);
    if (!m) return null;
    const [, h, min, sec] = m;
    if (Number(sec) > 59) return null;
    if (h && Number(min) > 59) return null;
    return (h ? Number(h) * 3600 : 0) + Number(min) * 60 + Number(sec);
}

/** 222 -> "3:42" (empty string for missing values), the inverse of parseDuration. */
export function durationInput(totalSeconds: number | null | undefined): string {
    if (!totalSeconds) return "";
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
}
