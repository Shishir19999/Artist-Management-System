"use client";
import { useSyncExternalStore } from "react";

/**
 * off     - visitor asked for reduced motion (or data saver): nothing animates.
 * reduced - small / low-power device: scroll reveals only, no parallax.
 * full    - everything.
 */
export type MotionLevel = "off" | "reduced" | "full";

interface NavigatorHints {
    deviceMemory?: number;
    connection?: { saveData?: boolean };
}

export function computeMotionLevel(env: {
    prefersReduced: boolean;
    width: number;
    cores?: number;
    memory?: number;
    saveData?: boolean;
}): MotionLevel {
    if (env.prefersReduced || env.saveData) return "off";
    if (env.width < 768 || (env.cores !== undefined && env.cores <= 2) || (env.memory !== undefined && env.memory <= 2)) return "reduced";
    return "full";
}

function read(): MotionLevel {
    const nav = navigator as Navigator & NavigatorHints;
    return computeMotionLevel({
        prefersReduced: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        width: window.innerWidth,
        cores: navigator.hardwareConcurrency || undefined,
        memory: nav.deviceMemory,
        saveData: nav.connection?.saveData,
    });
}

function subscribe(cb: () => void) {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const wq = window.matchMedia("(min-width: 768px)");
    mq.addEventListener("change", cb);
    wq.addEventListener("change", cb);
    return () => {
        mq.removeEventListener("change", cb);
        wq.removeEventListener("change", cb);
    };
}

export function useMotionLevel(): MotionLevel {
    return useSyncExternalStore(subscribe, read, () => "off");
}
