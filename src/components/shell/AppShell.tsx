"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
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
    LuUser,
    LuUserRound,
    LuUsers,
    LuX,
} from "react-icons/lu";
import DemoBanner from "@/components/DemoBanner";
import { PlayerProvider, usePlayer } from "@/components/player/Player";
import { Avatar } from "@/components/ui/Art";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { SkeletonRows } from "@/components/ui/States";
import { useAuth } from "@/lib/client/auth";
import { useMe, useOwnArtistId } from "@/lib/client/hooks";
import { canOpenPage, navFor, type NavEntry } from "@/lib/client/role-policy";
import { routes } from "@/lib/client/routes";
import { useDetailsDismiss } from "@/lib/client/use-dismiss";
import { useMediaQuery } from "@/lib/client/use-media-query";
import { ROLE_LABEL } from "@/lib/domain/constants";
import NotAvailable from "./NotAvailable";
import OnboardingTour, { TourPrompt } from "./OnboardingTour";
import SearchDialog from "./SearchDialog";

const ICONS: Record<NavEntry["id"], ReactNode> = {
    dashboard: <LuLayoutDashboard aria-hidden />,
    artists: <LuMic aria-hidden />,
    myProfile: <LuUserRound aria-hidden />,
    music: <LuMusic aria-hidden />,
    users: <LuUsers aria-hidden />,
    activity: <LuActivity aria-hidden />,
    calendar: <LuCalendar aria-hidden />,
    playlists: <LuListMusic aria-hidden />,
    favorites: <LuHeart aria-hidden />,
};

function NavList({ title, items, pathname, onNavigate, profileHref }: { title?: string; items: readonly NavEntry[]; pathname: string; onNavigate: () => void; profileHref: string }) {
    if (items.length === 0) return null;
    const clean = pathname.replace(/\/+$/, "");
    return (
        <div className="mb-2">
            {title && <p className="muted px-3 pt-3 pb-1 text-xs font-semibold tracking-wide uppercase">{title}</p>}
            <ul className="flex flex-col gap-1" aria-label={title ?? "Main"}>
                {items.map((n) => {
                    const active = clean === n.prefix || clean.startsWith(`${n.prefix}/`);
                    return (
                        <li key={n.id}>
                            <Link
                                href={n.id === "myProfile" ? profileHref : n.href}
                                aria-current={active ? "page" : undefined}
                                onClick={onNavigate}
                                className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                                    active ? "bg-primary text-primary-content" : "hover:bg-base-200"
                                }`}
                            >
                                {ICONS[n.id]}
                                {n.label}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

function Shell({ children }: { children: ReactNode }) {
    const { user, signOut } = useAuth();
    const pathname = usePathname() ?? "";
    const router = useRouter();
    const isDesktop = useMediaQuery("(min-width: 1024px)", true);
    const [drawer, setDrawer] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [tourOpen, setTourOpen] = useState(false);
    const player = usePlayer();
    const { me } = useMe();
    const ownArtistId = useOwnArtistId();
    const profileHref = ownArtistId ? routes.artistShow(ownArtistId) : routes.profile;
    const menuRef = useRef<HTMLDetailsElement>(null);
    const burgerRef = useRef<HTMLButtonElement>(null);
    const sidebarRef = useRef<HTMLElement>(null);
    useDetailsDismiss(menuRef);

    const drawerOpen = drawer && !isDesktop;

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement | null;
            const typing = target && (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable);
            if ((e.key === "k" && (e.ctrlKey || e.metaKey)) || (e.key === "/" && !typing)) {
                e.preventDefault();
                setSearchOpen(true);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    // the phone menu: opening it moves focus inside, Escape closes it and returns focus to the button
    useEffect(() => {
        if (!drawerOpen) return;
        sidebarRef.current?.querySelector<HTMLElement>("nav a")?.focus();
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setDrawer(false);
                burgerRef.current?.focus();
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [drawerOpen]);

    if (!user) return null;
    const role = user.role;
    const allowed = canOpenPage(role, pathname);
    const label = user.name || user.email || "Account";
    const closeDrawer = () => setDrawer(false);

    return (
        <div className="min-h-screen">
            <a href="#main" className="skip-link">
                Skip to content
            </a>

            {drawerOpen && <div className="fixed inset-0 z-30 bg-black/50" onClick={closeDrawer} aria-hidden />}

            <aside
                ref={sidebarRef}
                id="sidebar"
                aria-label="Main navigation"
                inert={!isDesktop && !drawer}
                className={`bg-base-100 border-base-300 fixed inset-y-0 left-0 z-40 flex w-64 max-w-[85vw] flex-col border-r transition-transform duration-200 lg:translate-x-0 ${
                    drawer ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                <div className="flex h-16 items-center justify-between px-4">
                    <Link href={routes.dashboard} className="flex min-h-11 items-center gap-2 text-lg font-bold tracking-tight" onClick={closeDrawer}>
                        <span className="bg-primary text-primary-content flex size-9 items-center justify-center rounded-xl" aria-hidden>
                            <LuMusic />
                        </span>
                        Artist Studio
                    </Link>
                    <button
                        type="button"
                        className="btn btn-ghost btn-circle size-11 lg:hidden"
                        aria-label="Close menu"
                        onClick={() => {
                            closeDrawer();
                            burgerRef.current?.focus();
                        }}
                    >
                        <LuX size={20} aria-hidden />
                    </button>
                </div>
                <nav aria-label="Workspace" className="flex-1 overflow-y-auto px-3 py-2">
                    <NavList items={navFor(role, "main")} pathname={pathname} onNavigate={closeDrawer} profileHref={profileHref} />
                    <NavList title="More" items={navFor(role, "more")} pathname={pathname} onNavigate={closeDrawer} profileHref={profileHref} />
                </nav>
                <div className="border-base-300 border-t p-3">
                    <Link href={routes.profile} onClick={closeDrawer} className="hover:bg-base-200 flex min-h-11 items-center gap-3 rounded-xl p-2">
                        <Avatar name={label} src={me?.image} size="sm" />
                        <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold">{label}</span>
                            <span className="muted block truncate text-xs">{ROLE_LABEL[role]}</span>
                        </span>
                    </Link>
                </div>
            </aside>

            <div className="lg:pl-64" inert={drawerOpen ? true : undefined}>
                <header className="bg-base-100/90 border-base-300 no-print sticky top-0 z-20 flex h-16 items-center gap-2 border-b px-3 backdrop-blur sm:px-5">
                    <button
                        ref={burgerRef}
                        type="button"
                        className="btn btn-ghost btn-circle size-12 lg:hidden"
                        aria-label="Open menu"
                        aria-controls="sidebar"
                        aria-expanded={drawerOpen}
                        onClick={() => setDrawer(true)}
                    >
                        <LuMenu size={24} aria-hidden />
                    </button>
                    <button
                        type="button"
                        className="btn btn-ghost border-base-300 h-11 min-h-11 flex-1 justify-start gap-2 sm:w-80 sm:max-w-sm sm:flex-none"
                        onClick={() => setSearchOpen(true)}
                        aria-label="Search (Ctrl+K)"
                    >
                        <LuSearch aria-hidden className="opacity-60" />
                        <span className="muted text-sm font-normal">Search</span>
                        <kbd className="kbd kbd-sm ml-auto hidden sm:inline-flex">Ctrl K</kbd>
                    </button>
                    <div className="ml-auto flex items-center gap-1">
                        <span className="badge badge-primary badge-soft hidden whitespace-nowrap sm:inline-flex" title="Your role">
                            {ROLE_LABEL[role]}
                        </span>
                        <ThemeToggle className="size-11" />
                        <details ref={menuRef} className="dropdown dropdown-end">
                            <summary className="btn btn-ghost h-11 min-h-11 gap-2 rounded-full px-1 sm:pr-3" aria-label={`Account menu, ${ROLE_LABEL[role]}`}>
                                <Avatar name={label} src={me?.image} size="xs" />
                                <span className="hidden max-w-32 truncate text-sm font-medium sm:inline">{label}</span>
                            </summary>
                            <ul className="menu dropdown-content bg-base-100 border-base-300 z-30 mt-2 w-64 rounded-xl border p-2 shadow-lg">
                                <li className="menu-title normal-case">
                                    <span className="block truncate">{user.email ?? label}</span>
                                    <span className="text-xs font-normal">{ROLE_LABEL[role]}</span>
                                </li>
                                <li>
                                    <Link href={routes.profile} className="min-h-11">
                                        <LuUser aria-hidden /> Account settings
                                    </Link>
                                </li>
                                <li>
                                    <button
                                        type="button"
                                        className="min-h-11"
                                        onClick={() => {
                                            if (menuRef.current) menuRef.current.open = false;
                                            setTourOpen(true);
                                        }}
                                    >
                                        <LuCircleHelp aria-hidden /> Take the tour
                                    </button>
                                </li>
                                <li>
                                    <button
                                        type="button"
                                        className="min-h-11"
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

                <main id="main" tabIndex={-1} className={`mx-auto max-w-7xl p-4 outline-none sm:p-6 ${player.current ? "pb-32" : ""}`}>
                    <DemoBanner />
                    <TourPrompt userId={user.id} onStart={() => setTourOpen(true)} />
                    {allowed ? children : <NotAvailable role={role} />}
                </main>
            </div>

            <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} role={role} />
            <OnboardingTour userId={user.id} role={role} open={tourOpen} onClose={() => setTourOpen(false)} />
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
            <main className="mx-auto max-w-3xl p-8" aria-label="Loading your workspace">
                <SkeletonRows rows={5} label="Loading your workspace" />
            </main>
        );
    }
    return (
        <PlayerProvider>
            <Shell>{children}</Shell>
        </PlayerProvider>
    );
}
