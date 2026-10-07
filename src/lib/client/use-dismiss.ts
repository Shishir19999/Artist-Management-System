"use client";
import { useEffect, type RefObject } from "react";

/**
 * Makes a native <details> dropdown behave like a menu: Escape closes it and puts focus back on the
 * summary, and so does a click or tap outside, or focus moving out of it.
 */
export function useDetailsDismiss(ref: RefObject<HTMLDetailsElement | null>) {
    useEffect(() => {
        const d = ref.current;
        if (!d) return;
        const close = (returnFocus: boolean) => {
            if (!d.open) return;
            d.open = false;
            if (returnFocus) d.querySelector<HTMLElement>("summary")?.focus();
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape" && d.open) {
                e.stopPropagation();
                close(true);
            }
        };
        const onPointer = (e: PointerEvent) => {
            if (!d.contains(e.target as Node)) close(false);
        };
        const onFocusOut = (e: FocusEvent) => {
            const next = e.relatedTarget as Node | null;
            if (next && !d.contains(next)) close(false);
        };
        d.addEventListener("keydown", onKey);
        d.addEventListener("focusout", onFocusOut);
        document.addEventListener("pointerdown", onPointer);
        return () => {
            d.removeEventListener("keydown", onKey);
            d.removeEventListener("focusout", onFocusOut);
            document.removeEventListener("pointerdown", onPointer);
        };
    }, [ref]);
}
