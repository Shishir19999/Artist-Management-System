import { decideAccess } from "@/lib/domain/access";
import type { AppRole } from "@/lib/roles";

/**
 * What each role may open and do in the interface. Pure data and helpers (no React) so the sidebar,
 * the page gate, the browser-only preview server and the tests all read the same rules.
 * The real API keeps its own authorization; this is the screen-level mirror of it.
 *
 *   ARTIST_MANAGER  runs the whole workspace: users, artists, music, bookings, activity.
 *   ARTIST          the musician: own profile, own music, own bookings; reads all music.
 *   USER            a listener: reads music, keeps favorites and playlists.
 */

export type NavGroup = "main" | "more";

export interface NavEntry {
    id: "dashboard" | "artists" | "myProfile" | "music" | "users" | "activity" | "calendar" | "playlists" | "favorites";
    href: string;
    /** the entry is highlighted for any path below this prefix */
    prefix: string;
    label: string;
    group: NavGroup;
    roles: readonly AppRole[];
}

const MANAGER: AppRole = "ARTIST_MANAGER";

export const NAV_ENTRIES: readonly NavEntry[] = [
    { id: "dashboard", href: "/admin/dashboard", prefix: "/admin/dashboard", label: "Dashboard", group: "main", roles: ["ARTIST_MANAGER", "ARTIST", "USER"] },
    { id: "artists", href: "/admin/artist", prefix: "/admin/artist", label: "Artists", group: "main", roles: [MANAGER] },
    // the href is replaced by the signed-in artist's own profile page (see AppShell)
    { id: "myProfile", href: "/admin/artist/show", prefix: "/admin/artist", label: "My Profile", group: "main", roles: ["ARTIST"] },
    { id: "music", href: "/admin/music", prefix: "/admin/music", label: "Music", group: "main", roles: ["ARTIST_MANAGER", "ARTIST", "USER"] },
    { id: "users", href: "/admin/user", prefix: "/admin/user", label: "Users", group: "main", roles: [MANAGER] },
    { id: "activity", href: "/admin/activity", prefix: "/admin/activity", label: "Activity", group: "more", roles: [MANAGER] },
    { id: "calendar", href: "/admin/calendar", prefix: "/admin/calendar", label: "Calendar", group: "more", roles: [MANAGER, "ARTIST"] },
    { id: "playlists", href: "/admin/playlists", prefix: "/admin/playlists", label: "Playlists", group: "more", roles: ["ARTIST_MANAGER", "ARTIST", "USER"] },
    { id: "favorites", href: "/admin/favorites", prefix: "/admin/favorites", label: "Favorites", group: "more", roles: ["ARTIST_MANAGER", "ARTIST", "USER"] },
];

export const navFor = (role: AppRole, group: NavGroup) => NAV_ENTRIES.filter((n) => n.group === group && n.roles.includes(role));

/** Can this role open this /admin page (list, detail, create or edit)? The matrix lives in src/lib/domain/access.ts. */
export const canOpenPage = (role: AppRole, pathname: string) =>
    decideAccess({ pathname: pathname.split("?")[0].split("#")[0], method: "GET", role }) === "allow";

/** Row-level rules shared by the screens and the preview server. */
export interface Actor {
    id: string;
    role: AppRole;
}

export const canBookGigs = (role: AppRole) => role === "ARTIST_MANAGER"; // the Artist sees own gigs read-only
export const isManager = (role: AppRole) => role === "ARTIST_MANAGER";
export const canWriteMusic = (role: AppRole) => role === "ARTIST_MANAGER" || role === "ARTIST";
export const canEditArtist = (actor: Actor, artist: { createdBy: string | null }) =>
    actor.role === "ARTIST_MANAGER" || (actor.role === "ARTIST" && artist.createdBy === actor.id);
export const canEditSong = (actor: Actor, song: { artistId: string | null }, ownArtistId: string | null | undefined) =>
    actor.role === "ARTIST_MANAGER" || (actor.role === "ARTIST" && !!ownArtistId && song.artistId === ownArtistId);

/** Dashboard cards each role sees, in the owner's layout: 3, 2 or 1 columns. */
export const DASHBOARD_CARDS: Record<AppRole, readonly ("users" | "artists" | "profile" | "music")[]> = {
    ARTIST_MANAGER: ["users", "artists", "music"],
    ARTIST: ["profile", "music"],
    USER: ["music"],
};

/** Roles anyone may pick when registering. Artist Manager accounts are only created by a manager. */
export const SELF_REGISTER_ROLES = ["USER", "ARTIST"] as const;
export type SelfRegisterRole = (typeof SELF_REGISTER_ROLES)[number];
