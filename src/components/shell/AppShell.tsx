"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
    LuActivity,
    LuCalendar,
    LuCircleHelp,
    LuHeart,
    LuLayoutDashboard,
    LuListMusic,
    LuLogOut,
    LuMenu,
    LuMic,
    LuMusic,
    LuSearch,
    LuShield,
    LuUser,
    LuUsers,
    LuX,
} from "react-icons/lu";
import DemoBanner from "@/components/DemoBanner";
import { PlayerProvider, usePlayer } from "@/components/player/Player";
import { Avatar } from "@/components/ui/Art";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { SkeletonRows } from "@/components/ui/States";
import { useAuth } from "@/lib/client/auth";
import { useMe } from "@/lib/client/hooks";
import { useMediaQuery } from "@/lib/client/use-media-query";
import { routes } from "@/lib/client/routes";
import { decideAccess } from "@/lib/domain/access";
import { ROLE_LABEL } from "@/lib/domain/constants";
import type { AppRole } from "@/lib/roles";
import OnboardingTour from "./OnboardingTour";
import SearchDialog from "./SearchDialog";

interface NavItem {
    href: string;
    label: string;
    icon: ReactNode;
    roles?: AppRole[];
}

const NAV: NavItem[] = [
    { href: routes.dashboard, label: "Dashboard", icon: <LuLayoutDashboard aria-hidden /> },
    { href: routes.artists, label: "Artists", icon: <LuMic aria-hidden /> },
    { href: routes.music, label: "Songs", icon: <LuMusic aria-hidden /> },
    { href: routes.playlists, label: "Playlists", icon: <LuListMusic aria-hidden /> },
    { href: routes.favorites, label: "Favorites", icon: <LuHeart aria-hidden /> },
    { href: routes.calendar, label: "Calendar", icon: <LuCalendar aria-hidden /> },
    { href: routes.activity, label: "Activity", icon: <LuActivity aria-hidden /> },
    { href: routes.users, label: "Users", icon: <LuUsers aria-hidden />, roles: ["ADMIN"] },
];

function NotAllowed({ role }: { role: AppRole }) {
    return (
        <div className="surface mx-auto mt-10 flex max-w-lg flex-col items-center gap-3 p-8 text-center">
            <span className="bg-base-200 text-warning flex size-14 items-center justify-center rounded-full" aria-hidden>
                <LuShield size={26} />
            </span>
            <h1 className="page-title">This area is not available to your role</h1>
            <p className="muted text-sm">
                You are signed in as {ROLE_LABEL[role]}. Ask an administrator if you need access to this page.
            </p>
            <Link href={routes.dashboard} className="btn btn-primary">
                Back to the dashboard
            </Link>
        </div>
    );
}

function Shell({ children }: { children: ReactNode }) {
    const { user, signOut } = useAuth();
    const pathname = usePathname() ?? "";
    const router = useRouter();
    const isDesktop = useMediaQuery("(min-width: 1024px)");
    const [drawer, setDrawer] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [tour, setTour] = useState(false);
    const player = usePlayer();
    const { me } = useMe();

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement | null;
            const typing = target && (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable);
            if ((e.key === "k" && (e.ctrlKey || e.metaKey)) || (e.key === "/" && !typing)) {
                e.preventDefault();
                setSearchOpen(true);
            }
            if (e.key === "Escape") setDrawer(false);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    if (!user) return null;
    const role = user.role;
    const allowed = decideAccess({ pathname, method: "GET", role }) === "allow";
    const label = user.name || user.email || "Account";
    const nav = NAV.filter((n) => !n.roles || n.roles.includes(role));
    const drawerOpen = drawer && !isDesktop;

    return (
        <div className="min-h-screen">
            <a href="#main" className="skip-link">
                Skip to content
            </a>

            {drawerOpen && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setDrawer(false)} aria-hidden />}

            <aside
                id="sidebar"
                aria-label="Main navigation"
                inert={!isDesktop && !drawer}
                className={`bg-base-100 border-base-300 fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r transition-transform duration-200 lg:translate-x-0 ${
                    drawer ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                <div className="flex h-16 items-center justify-between px-4">
                    <Link href={routes.dashboard} className="flex items-center gap-2 text-lg font-bold tracking-tight" onClick={() => setDrawer(false)}>
                        <span className="bg-primary text-primary-content flex size-9 items-center justify-center rounded-xl" aria-hidden>
                            <LuMusic />
                        </span>
                        Artist Studio
                    </Link>
                    <button type="button" className="btn btn-ghost btn-sm btn-circle lg:hidden" aria-label="Close menu" onClick={() => setDrawer(false)}>
                        <LuX aria-hidden />
                    </button>
                </div>
                <nav className="flex-1 overflow-y-auto px-3 py-2">
                    <ul className="flex flex-col gap-1">
                        {nav.map((n) => {
                            const active = pathname === n.href || pathname.startsWith(`${n.href}/`) || pathname.startsWith(`${n.href}?`);
                            return (
                                <li key={n.href}>
                                    <Link
                                        href={n.href}
                                        aria-current={active ? "page" : undefined}
                                        onClick={() => setDrawer(false)}
                                        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                                            active ? "bg-primary text-primary-content" : "hover:bg-base-200"
                                        }`}
                                    >
                                        {n.icon}
                                        {n.label}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>
                <div className="border-base-300 border-t p-3">
                    <Link href={routes.profile} onClick={() => setDrawer(false)} className="hover:bg-base-200 flex items-center gap-3 rounded-xl p-2">
                        <Avatar name={label} src={me?.image} size="sm" />
                        <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold">{label}</span>
                            <span className="muted block truncate text-xs">{ROLE_LABEL[role]}</span>
                        </span>
                    </Link>
                </div>
            </aside>

            <div className="lg:pl-64">
                <header className="bg-base-100/90 border-base-300 sticky top-0 z-20 flex h-16 items-center gap-2 border-b px-3 backdrop-blur sm:px-5 no-print">
                    <button
                        type="button"
                        className="btn btn-ghost btn-circle lg:hidden"
                        aria-label="Open menu"
                        aria-controls="sidebar"
                        aria-expanded={drawerOpen}
                        onClick={() => setDrawer(true)}
                    >
                        <LuMenu size={20} aria-hidden />
                    </button>
                    <button
                        type="button"
                        className="btn btn-ghost border-base-300 h-10 min-h-10 flex-1 justify-start gap-2 sm:max-w-sm sm:flex-none sm:w-80"
                        onClick={() => setSearchOpen(true)}
                        aria-label="Search (Ctrl+K)"
                    >
                        <LuSearch aria-hidden className="opacity-60" />
                        <span className="muted text-sm font-normal">Search</span>
                        <kbd className="kbd kbd-sm ml-auto hidden sm:inline-flex">Ctrl K</kbd>
                    </button>
                    <div className="ml-auto flex items-center gap-1">
                        <ThemeToggle />
                        <details className="dropdown dropdown-end">
                            <summary className="btn btn-ghost h-10 min-h-10 gap-2 rounded-full px-1 sm:pr-3" aria-label="Account menu">
                                <Avatar name={label} src={me?.image} size="xs" />
                                <span className="hidden max-w-32 truncate text-sm font-medium sm:inline">{label}</span>
                            </summary>
                            <ul className="menu dropdown-content bg-base-100 border-base-300 z-30 mt-2 w-60 rounded-xl border p-2 shadow-lg">
                                <li className="menu-title normal-case">
                                    <span className="block truncate">{user.email ?? label}</span>
                                    <span className="text-xs font-normal">{ROLE_LABEL[role]}</span>
                                </li>
                                <li>
                                    <Link href={routes.profile}>
                                        <LuUser aria-hidden /> Profile and settings
                                    </Link>
                                </li>
                                <li>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            (e.currentTarget.closest("details") as HTMLDetailsElement | null)?.removeAttribute("open");
                                            setTour(true);
                                        }}
                                    >
                                        <LuCircleHelp aria-hidden /> Replay the tour
                                    </button>
                                </li>
                                <li>
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            player.stop();
                                            await signOut();
                                            router.push(routes.login);
                                        }}
                                    >
                                        <LuLogOut aria-hidden /> Sign out
                                    </button>
                                </li>
                            </ul>
                        </details>
                    </div>
                </header>

                <DemoBanner />

                <main id="main" tabIndex={-1} className={`mx-auto max-w-7xl p-4 outline-none sm:p-6 ${player.current ? "pb-32" : ""}`}>
                    {allowed ? children : <NotAllowed role={role} />}
                </main>
            </div>

            <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
            <OnboardingTour userId={user.id} role={role} forceOpen={tour} onClose={() => setTour(false)} />
        </div>
    );
}

/** Client-side auth gate + chrome for every /admin page (the real build also checks the session on the server). */
export default function AppShell({ children }: { children: ReactNode }) {
    const { status } = useAuth();
    const router = useRouter();
    const pathname = usePathname() ?? "";

    useEffect(() => {
        if (status === "unauthenticated") router.replace(`${routes.login}?callbackUrl=${encodeURIComponent(pathname)}`);
    }, [status, router, pathname]);

    if (status !== "authenticated") {
        return (
            <div className="mx-auto max-w-3xl p-8" role="status" aria-label="Loading your workspace">
                <SkeletonRows rows={5} label="Loading your workspace" />
            </div>
        );
    }
    return (
        <PlayerProvider>
            <Shell>{children}</Shell>
        </PlayerProvider>
    );
}
