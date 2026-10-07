"use client";
import { LuMoon, LuSun } from "react-icons/lu";
import { setTheme, useTheme } from "@/lib/client/theme";

export default function ThemeToggle({ className = "" }: { className?: string }) {
    const theme = useTheme();
    const dark = theme === "studio-dark";
    return (
        <button
            type="button"
            className={`btn btn-ghost btn-circle ${className}`}
            aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
            title={dark ? "Light theme" : "Dark theme"}
            onClick={() => setTheme(dark ? "studio" : "studio-dark")}
        >
            {dark ? <LuSun size={20} aria-hidden /> : <LuMoon size={20} aria-hidden />}
        </button>
    );
}
