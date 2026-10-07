export function formatDuration(totalSeconds: number | null | undefined): string {
    if (!totalSeconds || totalSeconds < 0) return "-";
    const m = Math.floor(totalSeconds / 60);
    const s = Math.round(totalSeconds % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
}

export function formatTotalDuration(totalSeconds: number): string {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.round((totalSeconds % 3600) / 60);
    return h ? `${h} h ${m} min` : `${m} min`;
}

export function formatDate(iso: string | null | undefined): string {
    if (!iso) return "-";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: iso.length <= 10 || iso.endsWith("T00:00:00.000Z") ? "UTC" : undefined });
}

export function formatDateTime(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function formatMoney(amount: number | null | undefined): string {
    if (amount === null || amount === undefined) return "-";
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);
}

export function relativeTime(iso: string, now = Date.now()): string {
    const diff = Math.round((now - new Date(iso).getTime()) / 1000);
    const abs = Math.abs(diff);
    if (abs < 45) return "just now";
    const [value, unit] =
        abs < 3600 ? [Math.round(abs / 60), "minute"]
        : abs < 86400 ? [Math.round(abs / 3600), "hour"]
        : abs < 2592000 ? [Math.round(abs / 86400), "day"]
        : abs < 31536000 ? [Math.round(abs / 2592000), "month"]
        : [Math.round(abs / 31536000), "year"];
    const text = `${value} ${unit}${value === 1 ? "" : "s"}`;
    return diff >= 0 ? `${text} ago` : `in ${text}`;
}

export function initials(name: string | null | undefined): string {
    const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "?";
    return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export function hashString(input: string): number {
    let h = 2166136261;
    for (let i = 0; i < input.length; i++) {
        h ^= input.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

/** Deterministic two-stop gradient so every artist/song gets stable, distinct art without image files. */
export function gradientFor(seed: string): string {
    const h = hashString(seed);
    const a = h % 360;
    const b = (a + 40 + ((h >> 8) % 80)) % 360;
    return `linear-gradient(135deg, hsl(${a} 62% 38%), hsl(${b} 66% 28%))`;
}
