/* eslint-disable @next/next/no-img-element -- images here are data URLs, which next/image cannot optimise */
import { LuMusic } from "react-icons/lu";
import { gradientFor, initials } from "@/lib/client/format";

const SIZE: Record<string, string> = {
    xs: "size-8 text-xs",
    sm: "size-10 text-sm",
    md: "size-14 text-base",
    lg: "size-24 text-2xl",
    xl: "size-32 text-4xl",
};

export function Avatar({
    name,
    src,
    size = "sm",
    className = "",
    rounded = "full",
}: {
    name: string | null | undefined;
    src?: string | null;
    size?: keyof typeof SIZE;
    className?: string;
    rounded?: "full" | "xl";
}) {
    const shape = rounded === "full" ? "rounded-full" : "rounded-2xl";
    if (src) {
        return <img src={src} alt="" className={`${SIZE[size]} ${shape} shrink-0 object-cover ${className}`} />;
    }
    return (
        <span
            aria-hidden
            className={`${SIZE[size]} ${shape} inline-flex shrink-0 items-center justify-center font-semibold text-white ${className}`}
            style={{ backgroundImage: gradientFor(name ?? "?") }}
        >
            {initials(name)}
        </span>
    );
}

export function CoverArt({
    title,
    src,
    size = "sm",
    className = "",
}: {
    title: string;
    src?: string | null;
    size?: keyof typeof SIZE;
    className?: string;
}) {
    if (src) {
        return <img src={src} alt="" className={`${SIZE[size]} shrink-0 rounded-lg object-cover ${className}`} />;
    }
    return (
        <span
            aria-hidden
            className={`${SIZE[size]} inline-flex shrink-0 items-center justify-center rounded-lg text-white/90 ${className}`}
            style={{ backgroundImage: gradientFor(title) }}
        >
            <LuMusic />
        </span>
    );
}
