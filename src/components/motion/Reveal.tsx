"use client";
import { useEffect, useLayoutEffect, useRef, type CSSProperties, type ElementType, type ReactNode } from "react";
import { useMotionLevel } from "./motion";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Fade/slide-in when the element scrolls into view (opacity + transform only).
 * Content is always rendered visible first; it is only hidden (before paint) when it starts below
 * the fold and motion is allowed, so there is no layout shift and nothing is lost without JS or
 * with reduced motion.
 */
export default function Reveal({
    children,
    as: Tag = "div",
    delay = 0,
    from,
    className,
    style,
}: {
    children: ReactNode;
    as?: ElementType;
    delay?: number;
    from?: "left" | "right";
    className?: string;
    style?: CSSProperties;
}) {
    const ref = useRef<HTMLElement | null>(null);
    const level = useMotionLevel();

    useIsoLayoutEffect(() => {
        const el = ref.current;
        if (!el || level === "off") return;
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.92) return; // already on screen: leave it alone
        el.setAttribute("data-reveal", "pending");
        const io = new IntersectionObserver(
            (entries) => {
                for (const e of entries) {
                    if (e.isIntersecting) {
                        el.setAttribute("data-reveal", "in");
                        io.disconnect();
                    }
                }
            },
            { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
        );
        io.observe(el);
        return () => {
            io.disconnect();
            el.removeAttribute("data-reveal");
        };
    }, [level]);

    return (
        <Tag
            ref={ref}
            className={className}
            data-reveal-from={from}
            style={{ ...style, ["--reveal-delay" as string]: `${delay}ms` }}
        >
            {children}
        </Tag>
    );
}
