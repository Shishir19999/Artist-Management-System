"use client";
import axios from "axios";
import { useCallback, useEffect, useSyncExternalStore } from "react";
import { handleError } from "@/utils/errorsHandle";

/**
 * Tiny stale-while-revalidate cache for GET /api/** (works the same against the real server
 * and the in-browser demo adapter). Any mutation calls invalidate(), which refetches mounted readers.
 */
interface Entry {
    data?: unknown;
    error?: string;
    status?: number;
    loading: boolean;
    ts: number;
    req?: number;
}

const EMPTY: Entry = { loading: true, ts: 0 };
const entries = new Map<string, Entry>();
const listeners = new Set<() => void>();
const STALE_MS = 20_000;
let reqCounter = 0;

const emit = () => listeners.forEach((l) => l());
const subscribe = (cb: () => void) => {
    listeners.add(cb);
    return () => {
        listeners.delete(cb);
    };
};

function load(url: string) {
    const cur = entries.get(url);
    if (cur?.loading && cur.req) return;
    const req = ++reqCounter;
    entries.set(url, { ...(cur ?? EMPTY), loading: true, req });
    emit();
    // invalidate() deletes the entry, so a response for a replaced/removed entry is simply dropped
    const stillCurrent = () => entries.get(url)?.req === req;
    axios
        .get(url)
        .then((res) => {
            if (stillCurrent()) entries.set(url, { data: res.data, loading: false, ts: Date.now() });
        })
        .catch((err: unknown) => {
            if (stillCurrent())
                entries.set(url, {
                    error: handleError(err),
                    status: (err as { response?: { status?: number } })?.response?.status,
                    loading: false,
                    ts: Date.now(),
                });
        })
        .finally(emit);
}

/** Drop cached responses (all, or those whose URL starts with `prefix`) so mounted readers refetch. */
export function invalidate(prefix?: string) {
    for (const key of [...entries.keys()]) if (!prefix || key.startsWith(prefix)) entries.delete(key);
    emit();
}

export interface ApiState<T> {
    data: T | undefined;
    error: string | null;
    status: number | undefined;
    loading: boolean;
    reload: () => void;
}

export function useApi<T>(url: string | null): ApiState<T> {
    const entry = useSyncExternalStore(
        subscribe,
        () => (url ? entries.get(url) : undefined),
        () => undefined
    );
    const missing = entry === undefined;

    useEffect(() => {
        if (!url) return;
        const cur = entries.get(url);
        if (!cur || (!cur.loading && Date.now() - cur.ts > STALE_MS)) load(url);
    }, [url, missing]);

    const reload = useCallback(() => {
        if (url) invalidate(url);
    }, [url]);

    return {
        data: entry?.data as T | undefined,
        error: entry?.error ?? null,
        status: entry?.status,
        loading: !url ? false : !entry || (entry.loading && entry.data === undefined && !entry.error),
        reload,
    };
}
