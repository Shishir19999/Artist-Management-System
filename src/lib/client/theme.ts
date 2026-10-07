"use client";
import { useSyncExternalStore } from "react";

export const THEME_KEY = "ams-theme";
export type ThemeName = "studio" | "studio-dark";

/** Runs before first paint (inline in <head>): saved choice first, then the OS preference. */
export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_KEY}");if(t!=="studio"&&t!=="studio-dark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"studio-dark":"studio"}document.documentElement.setAttribute("data-theme",t)}catch(e){}})();`;

const listeners = new Set<() => void>();

function current(): ThemeName {
    return document.documentElement.getAttribute("data-theme") === "studio-dark" ? "studio-dark" : "studio";
}

export function setTheme(theme: ThemeName) {
    document.documentElement.setAttribute("data-theme", theme);
    try {
        localStorage.setItem(THEME_KEY, theme);
    } catch {
        /* storage may be unavailable (private mode); the choice then lasts for this visit only */
    }
    listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
    listeners.add(cb);
    // follow the OS setting until the visitor makes an explicit choice
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => {
        let saved: string | null = null;
        try {
            saved = localStorage.getItem(THEME_KEY);
        } catch {
            /* ignore */
        }
        if (!saved) {
            document.documentElement.setAttribute("data-theme", e.matches ? "studio-dark" : "studio");
            cb();
        }
    };
    mq.addEventListener("change", onChange);
    return () => {
        listeners.delete(cb);
        mq.removeEventListener("change", onChange);
    };
}

export function useTheme(): ThemeName {
    return useSyncExternalStore(subscribe, current, () => "studio");
}
