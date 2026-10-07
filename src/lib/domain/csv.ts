export interface CsvColumn<T> {
    key: keyof T & string;
    label: string;
}

// Spreadsheet apps execute cells starting with these characters as formulas.
function guard(value: string): string {
    return /^[=+@\t\r]/.test(value) || /^-(?!\d+(\.\d+)?$)/.test(value) ? `'${value}` : value;
}

function cell(value: unknown): string {
    if (value === null || value === undefined) return "";
    const text = guard(String(value));
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv<T extends object>(rows: T[], columns: CsvColumn<T>[]): string {
    const head = columns.map((c) => cell(c.label)).join(",");
    const body = rows.map((r) => columns.map((c) => cell((r as Record<string, unknown>)[c.key])).join(","));
    return [head, ...body].join("\r\n") + "\r\n";
}

/** RFC 4180 style parser (quoted fields, doubled quotes, CRLF/LF, optional BOM). */
export function parseCsv(input: string): string[][] {
    const text = input.replace(/^﻿/, "");
    const rows: string[][] = [];
    let row: string[] = [];
    let field = "";
    let quoted = false;
    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (quoted) {
            if (ch === '"') {
                if (text[i + 1] === '"') {
                    field += '"';
                    i++;
                } else quoted = false;
            } else field += ch;
        } else if (ch === '"') quoted = true;
        else if (ch === ",") {
            row.push(field);
            field = "";
        } else if (ch === "\n" || ch === "\r") {
            if (ch === "\r" && text[i + 1] === "\n") i++;
            row.push(field);
            field = "";
            if (row.some((c) => c !== "")) rows.push(row);
            row = [];
        } else field += ch;
    }
    row.push(field);
    if (row.some((c) => c !== "")) rows.push(row);
    return rows;
}

/** Turns parsed rows into objects keyed by the column `key`, matching headers by label or key (case-insensitive). */
export function csvToObjects<T extends object>(rows: string[][], columns: CsvColumn<T>[]): Record<string, string>[] {
    if (rows.length < 2) return [];
    const lookup = new Map<string, string>();
    for (const c of columns) {
        lookup.set(c.label.trim().toLowerCase(), c.key);
        lookup.set(c.key.toLowerCase(), c.key);
    }
    const headers = rows[0].map((h) => lookup.get(h.trim().toLowerCase()) ?? null);
    return rows.slice(1).map((r) => {
        const o: Record<string, string> = {};
        headers.forEach((k, i) => {
            if (k) o[k] = (r[i] ?? "").trim().replace(/^'(?=[=+@\-\t\r])/, "");
        });
        return o;
    });
}
