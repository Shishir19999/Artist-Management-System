"use client";
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { useMotionLevel } from "./motion";

/**
 * Moves its children vertically at a fraction of the scroll speed (transform only).
 * Driven by an IntersectionObserver (only tracks while visible) + requestAnimationFrame.
 * Disabled for reduced motion and on small / low-power screens. Decorative: aria-hidden by default.
 */
export default function Parallax({
    children,
    speed = 0.15,
    className,
    style,
    decorative = true,
}: {
    children?: ReactNode;
    /** 0.1 = drifts 10% of the scroll distance; negative moves the other way. */
    speed?: number;
    className?: string;
    style?: CSSProperties;
    decorative?: boolean;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const level = useMotionLevel();

    useEffect(() => {
        const el = ref.current;
        if (!el || level !== "full") return;
        let raf = 0;
        let visible = false;

        const update = () => {
            raf = 0;
            const rect = el.getBoundingClientRect();
            // distance of the element's centre from the viewport centre, minus what the transform already added
            const centre = rect.top + rect.height / 2 - window.innerHeight / 2;
            const current = Number(el.dataset.offset || 0);
            const natural = centre - current;
            const next = Math.round(-natural * speed * 10) / 10;
            if (next !== current) {
                el.dataset.offset = String(next);
                el.style.transform = `translate3d(0, ${next}px, 0)`;
            }
        };
        const onScroll = () => {
            if (visible && !raf) raf = requestAnimationFrame(update);
        };
        const io = new IntersectionObserver(
            ([entry]) => {
                visible = entry.isIntersecting;
                if (visible) onScroll();
            },
            { rootMargin: "20% 0px 20% 0px" }
        );
        io.observe(el);
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll, { passive: true });
        return () => {
            io.disconnect();
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onScroll);
            if (raf) cancelAnimationFrame(raf);
            el.style.transform = "";
            delete el.dataset.offset;
        };
    }, [level, speed]);

    return (
        <div ref={ref} data-parallax className={className} style={style} aria-hidden={decorative || undefined}>
            {children}
        </div>
    );
}
