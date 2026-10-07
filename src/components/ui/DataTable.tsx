"use client";
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { LuArrowDown, LuArrowUp, LuArrowUpDown, LuChevronLeft, LuChevronRight, LuColumns3, LuDownload, LuSearch, LuX } from "react-icons/lu";
import { toCsv } from "@/lib/domain/csv";
import { EmptyState, ErrorState, SkeletonRows } from "./States";

export interface Column<T> {
    key: string;
    header: string;
    /** plain value used for sorting, searching and CSV export */
    accessor: (row: T) => string | number | null | undefined;
    cell?: (row: T) => ReactNode;
    sortable?: boolean;
    hiddenByDefault?: boolean;
    numeric?: boolean;
    noExport?: boolean;
    className?: string;
}

export interface TableFilter<T> {
    key: string;
    label: string;
    options: { value: string; label: string }[];
    match: (row: T, value: string) => boolean;
}

interface Props<T> {
    caption: string;
    rows: T[];
    columns: Column<T>[];
    getId: (row: T) => string;
    loading?: boolean;
    error?: string | null;
    onRetry?: () => void;
    emptyTitle: string;
    emptyMessage?: string;
    emptyAction?: ReactNode;
    filters?: TableFilter<T>[];
    selectable?: boolean;
    bulkActions?: (selected: T[], clear: () => void) => ReactNode;
    toolbar?: ReactNode;
    rowActions?: (row: T) => ReactNode;
    csvName?: string;
    storageKey?: string;
    initialSort?: { key: string; dir: "asc" | "desc" };
    pageSizes?: number[];
}

function compare(a: string | number | null | undefined, b: string | number | null | undefined): number {
    const aNull = a === null || a === undefined || a === "";
    const bNull = b === null || b === undefined || b === "";
    if (aNull && bNull) return 0;
    if (aNull) return 1;
    if (bNull) return -1;
    if (typeof a === "number" && typeof b === "number") return a - b;
    return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
}

function readHidden(storageKey: string | undefined, defaults: string[]): Set<string> {
    if (typeof window === "undefined" || !storageKey) return new Set(defaults);
    try {
        const raw = localStorage.getItem(`ams-cols-${storageKey}`);
        if (raw) return new Set(JSON.parse(raw) as string[]);
    } catch {
        /* fall through to defaults */
    }
    return new Set(defaults);
}

export default function DataTable<T>({
    caption,
    rows,
    columns,
    getId,
    loading,
    error,
    onRetry,
    emptyTitle,
    emptyMessage,
    emptyAction,
    filters = [],
    selectable,
    bulkActions,
    toolbar,
    rowActions,
    csvName,
    storageKey,
    initialSort,
    pageSizes = [10, 25, 50, 100],
}: Props<T>) {
    const uid = useId();
    const [query, setQuery] = useState("");
    const [filterValues, setFilterValues] = useState<Record<string, string>>({});
    const [sort, setSort] = useState(initialSort ?? null);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(pageSizes[0]);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [hidden, setHidden] = useState<Set<string>>(() =>
        readHidden(storageKey, columns.filter((c) => c.hiddenByDefault).map((c) => c.key))
    );
    const colMenu = useRef<HTMLDetailsElement>(null);

    useEffect(() => {
        const close = (e: PointerEvent) => {
            const d = colMenu.current;
            if (d?.open && !d.contains(e.target as Node)) d.open = false;
        };
        document.addEventListener("pointerdown", close);
        return () => document.removeEventListener("pointerdown", close);
    }, []);

    const visibleColumns = columns.filter((c) => !hidden.has(c.key));

    const processed = useMemo(() => {
        const q = query.trim().toLowerCase();
        let list = rows;
        if (q) list = list.filter((r) => columns.some((c) => String(c.accessor(r) ?? "").toLowerCase().includes(q)));
        for (const f of filters) {
            const v = filterValues[f.key];
            if (v) list = list.filter((r) => f.match(r, v));
        }
        if (sort) {
            const col = columns.find((c) => c.key === sort.key);
            if (col) {
                const dir = sort.dir === "asc" ? 1 : -1;
                list = [...list].sort((a, b) => {
                    const x = col.accessor(a);
                    const y = col.accessor(b);
                    const xn = x === null || x === undefined || x === "";
                    const yn = y === null || y === undefined || y === "";
                    if (xn || yn) return xn === yn ? 0 : xn ? 1 : -1; // empty values always last
                    return compare(x, y) * dir;
                });
            }
        }
        return list;
    }, [rows, columns, query, filters, filterValues, sort]);

    const pageCount = Math.max(1, Math.ceil(processed.length / pageSize));
    const safePage = Math.min(page, pageCount - 1);
    const pageRows = processed.slice(safePage * pageSize, safePage * pageSize + pageSize);

    const rowIds = useMemo(() => new Set(rows.map(getId)), [rows, getId]);
    const selectedRows = rows.filter((r) => selected.has(getId(r)) && rowIds.has(getId(r)));
    const allOnPage = pageRows.length > 0 && pageRows.every((r) => selected.has(getId(r)));
    const someOnPage = pageRows.some((r) => selected.has(getId(r)));
    const headCheckbox = useRef<HTMLInputElement>(null);
    useEffect(() => {
        if (headCheckbox.current) headCheckbox.current.indeterminate = someOnPage && !allOnPage;
    }, [someOnPage, allOnPage]);

    const filtering = Boolean(query) || Object.values(filterValues).some(Boolean);

    const toggleSort = (key: string) => {
        setPage(0);
        setSort((s) => (!s || s.key !== key ? { key, dir: "asc" } : s.dir === "asc" ? { key, dir: "desc" } : null));
    };

    const toggleColumn = (key: string) => {
        setHidden((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            if (storageKey) {
                try {
                    localStorage.setItem(`ams-cols-${storageKey}`, JSON.stringify([...next]));
                } catch {
                    /* ignore */
                }
            }
            return next;
        });
    };

    const exportCsv = () => {
        const cols = columns.filter((c) => !c.noExport);
        const data = processed.map((r) => Object.fromEntries(cols.map((c) => [c.key, c.accessor(r)])));
        const csv = toCsv(data, cols.map((c) => ({ key: c.key, label: c.header })));
        const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${csvName ?? "export"}-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    };

    const colSpan = visibleColumns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0);

    return (
        <section className="surface overflow-hidden" aria-label={caption}>
            <div className="flex flex-wrap items-center gap-2 border-b border-base-300 p-3">
                <label className="input input-sm min-w-0 flex-1 basis-48 items-center gap-2 sm:max-w-xs">
                    <LuSearch aria-hidden className="shrink-0 opacity-60" />
                    <span className="sr-only">Search {caption}</span>
                    <input
                        type="search"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setPage(0);
                        }}
                        placeholder="Search"
                        className="min-w-0 grow"
                    />
                </label>
                {filters.map((f) => (
                    <label key={f.key} className="flex items-center">
                        <span className="sr-only">{f.label}</span>
                        <select
                            className="select select-sm max-w-40"
                            value={filterValues[f.key] ?? ""}
                            onChange={(e) => {
                                setFilterValues((v) => ({ ...v, [f.key]: e.target.value }));
                                setPage(0);
                            }}
                        >
                            <option value="">{f.label}: all</option>
                            {f.options.map((o) => (
                                <option key={o.value} value={o.value}>
                                    {o.label}
                                </option>
                            ))}
                        </select>
                    </label>
                ))}
                <div className="ml-auto flex flex-wrap items-center gap-2">
                    {toolbar}
                    <details ref={colMenu} className="dropdown dropdown-end">
                        <summary className="btn btn-sm btn-ghost gap-1.5" aria-label="Choose visible columns">
                            <LuColumns3 aria-hidden /> <span className="hidden sm:inline">Columns</span>
                        </summary>
                        <ul className="dropdown-content bg-base-100 border-base-300 z-20 mt-1 w-56 rounded-xl border p-2 shadow-lg">
                            {columns.map((c) => (
                                <li key={c.key}>
                                    <label className="hover:bg-base-200 flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm">
                                        <input
                                            type="checkbox"
                                            className="checkbox checkbox-sm checkbox-primary"
                                            checked={!hidden.has(c.key)}
                                            onChange={() => toggleColumn(c.key)}
                                        />
                                        {c.header}
                                    </label>
                                </li>
                            ))}
                        </ul>
                    </details>
                    {csvName && (
                        <button type="button" className="btn btn-sm btn-ghost gap-1.5" onClick={exportCsv} disabled={!processed.length}>
                            <LuDownload aria-hidden /> <span className="hidden sm:inline">Export CSV</span>
                            <span className="sr-only sm:hidden">Export CSV</span>
                        </button>
                    )}
                </div>
            </div>

            {selectable && bulkActions && selectedRows.length > 0 && (
                <div className="bg-primary/10 flex flex-wrap items-center gap-2 border-b border-base-300 px-3 py-2" role="region" aria-label="Bulk actions">
                    <span className="text-sm font-medium">{selectedRows.length} selected</span>
                    {bulkActions(selectedRows, () => setSelected(new Set()))}
                    <button type="button" className="btn btn-ghost btn-xs ml-auto gap-1" onClick={() => setSelected(new Set())}>
                        <LuX aria-hidden /> Clear
                    </button>
                </div>
            )}

            {loading ? (
                <div className="p-4">
                    <SkeletonRows rows={6} label={`Loading ${caption}`} />
                </div>
            ) : error ? (
                <ErrorState message={error} onRetry={onRetry} />
            ) : rows.length === 0 ? (
                <EmptyState title={emptyTitle} message={emptyMessage} action={emptyAction} />
            ) : (
                <>
                    <div className="scroll-x">
                        <table className="table table-sm sm:table-md">
                            <caption className="sr-only">{caption}</caption>
                            <thead>
                                <tr className="bg-base-200">
                                    {selectable && (
                                        <th className="w-10">
                                            <input
                                                ref={headCheckbox}
                                                type="checkbox"
                                                className="checkbox checkbox-sm checkbox-primary"
                                                aria-label="Select all rows on this page"
                                                checked={allOnPage}
                                                onChange={() =>
                                                    setSelected((prev) => {
                                                        const next = new Set(prev);
                                                        for (const r of pageRows) {
                                                            if (allOnPage) next.delete(getId(r));
                                                            else next.add(getId(r));
                                                        }
                                                        return next;
                                                    })
                                                }
                                            />
                                        </th>
                                    )}
                                    {visibleColumns.map((c) => {
                                        const sortable = c.sortable !== false;
                                        const active = sort?.key === c.key ? sort.dir : null;
                                        return (
                                            <th
                                                key={c.key}
                                                scope="col"
                                                aria-sort={active ? (active === "asc" ? "ascending" : "descending") : sortable ? "none" : undefined}
                                                className={`whitespace-nowrap ${c.numeric ? "text-right" : ""}`}
                                            >
                                                {sortable ? (
                                                    <button
                                                        type="button"
                                                        className="hover:text-primary inline-flex items-center gap-1.5 font-semibold"
                                                        onClick={() => toggleSort(c.key)}
                                                    >
                                                        {c.header}
                                                        {active === "asc" ? (
                                                            <LuArrowUp aria-hidden size={14} />
                                                        ) : active === "desc" ? (
                                                            <LuArrowDown aria-hidden size={14} />
                                                        ) : (
                                                            <LuArrowUpDown aria-hidden size={14} className="opacity-40" />
                                                        )}
                                                    </button>
                                                ) : (
                                                    c.header
                                                )}
                                            </th>
                                        );
                                    })}
                                    {rowActions && (
                                        <th scope="col" className="text-right">
                                            Actions
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {pageRows.length === 0 ? (
                                    <tr>
                                        <td colSpan={colSpan}>
                                            <EmptyState
                                                title="No matches"
                                                message="Nothing fits the current search and filters."
                                                action={
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-primary"
                                                        onClick={() => {
                                                            setQuery("");
                                                            setFilterValues({});
                                                        }}
                                                    >
                                                        Clear filters
                                                    </button>
                                                }
                                            />
                                        </td>
                                    </tr>
                                ) : (
                                    pageRows.map((r) => {
                                        const id = getId(r);
                                        return (
                                            <tr key={id} className={`hover:bg-base-200/60 ${selected.has(id) ? "bg-primary/5" : ""}`}>
                                                {selectable && (
                                                    <td>
                                                        <input
                                                            type="checkbox"
                                                            className="checkbox checkbox-sm checkbox-primary"
                                                            aria-label="Select row"
                                                            checked={selected.has(id)}
                                                            onChange={() =>
                                                                setSelected((prev) => {
                                                                    const next = new Set(prev);
                                                                    if (next.has(id)) next.delete(id);
                                                                    else next.add(id);
                                                                    return next;
                                                                })
                                                            }
                                                        />
                                                    </td>
                                                )}
                                                {visibleColumns.map((c) => (
                                                    <td key={c.key} className={`${c.numeric ? "text-right tabular-nums" : ""} ${c.className ?? ""}`}>
                                                        {c.cell ? c.cell(r) : (c.accessor(r) ?? "-")}
                                                    </td>
                                                ))}
                                                {rowActions && <td className="text-right whitespace-nowrap">{rowActions(r)}</td>}
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-base-300 px-3 py-2 text-sm">
                        <p className="muted" aria-live="polite">
                            {processed.length === 0
                                ? "0 results"
                                : `${safePage * pageSize + 1}-${Math.min(processed.length, (safePage + 1) * pageSize)} of ${processed.length}`}
                            {filtering && ` (filtered from ${rows.length})`}
                        </p>
                        <div className="flex items-center gap-2">
                            <label className="flex items-center gap-1.5">
                                <span className="muted">Rows</span>
                                <select
                                    id={`${uid}-ps`}
                                    className="select select-xs"
                                    value={pageSize}
                                    onChange={(e) => {
                                        setPageSize(Number(e.target.value));
                                        setPage(0);
                                    }}
                                >
                                    {pageSizes.map((n) => (
                                        <option key={n} value={n}>
                                            {n}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <nav aria-label="Pagination" className="join">
                                <button
                                    type="button"
                                    className="btn btn-xs join-item"
                                    onClick={() => setPage(safePage - 1)}
                                    disabled={safePage === 0}
                                    aria-label="Previous page"
                                >
                                    <LuChevronLeft aria-hidden />
                                </button>
                                <span className="btn btn-xs join-item pointer-events-none" aria-current="page">
                                    {safePage + 1} / {pageCount}
                                </span>
                                <button
                                    type="button"
                                    className="btn btn-xs join-item"
                                    onClick={() => setPage(safePage + 1)}
                                    disabled={safePage >= pageCount - 1}
                                    aria-label="Next page"
                                >
                                    <LuChevronRight aria-hidden />
                                </button>
                            </nav>
                        </div>
                    </div>
                </>
            )}
        </section>
    );
}
