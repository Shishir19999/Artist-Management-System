"use client";
import { useCallback, useSyncExternalStore } from "react";

const listeners = new Set<() => void>();

function read(key: string): string | null {
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
}

export function writeFlag(key: string, value: string | null) {
    try {
        if (value === null) localStorage.removeItem(key);
        else localStorage.setItem(key, value);
    } catch {
        /* storage unavailable: the choice lasts until the page is reloaded */
    }
    memory.set(key, value);
    listeners.forEach((l) => l());
}

const memory = new Map<string, string | null>();

const subscribe = (cb: () => void) => {
    listeners.add(cb);
    window.addEventListener("storage", cb);
    return () => {
        listeners.delete(cb);
        window.removeEventListener("storage", cb);
    };
};

/**
 * A small per-browser flag kept in localStorage. Until the browser has been asked the value is `undefined`
 * (server and first client render agree), so callers can avoid flashing content that is later hidden.
 */
export function useLocalFlag(key: string): [string | null | undefined, (value: string | null) => void] {
    const value = useSyncExternalStore(
        subscribe,
        () => (memory.has(key) ? (memory.get(key) ?? null) : read(key)),
        () => undefined
    );
    const set = useCallback((v: string | null) => writeFlag(key, v), [key]);
    return [value, set];
}
