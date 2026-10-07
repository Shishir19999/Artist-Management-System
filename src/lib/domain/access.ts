import type { AppRole } from "@/lib/roles";

export type AccessDecision = "allow" | "deny";

const startsWithPath = (pathname: string, base: string) => pathname === base || pathname.startsWith(`${base}/`);
const trimSlashes = (p: string) => {
    let end = p.length;
    while (end > 1 && p[end - 1] === "/") end--;
    return p.slice(0, end);
};
const isWriteScreen = (p: string) => p.endsWith("/create") || p.includes("/create/") || p.endsWith("/edit") || p.includes("/edit/");

/**
 * Coarse role gate shared by the real middleware (src/proxy.ts), the sidebar and the browser-only demo.
 * Assumes the caller is authenticated with a valid role. Route handlers still check ownership.
 *
 * ARTIST_MANAGER (top role): everything - users, artists, music, gigs, playlists, favorites, activity.
 *   Pages: Dashboard, Artists, Music, Users (+ gigs/calendar/playlists/favorites/activity/profile).
 * ARTIST: reads all music and artists' public details; edits only their own artist record and
 *   creates/edits/deletes only music of that artist (handlers enforce "own"); edits their own account.
 *   Read-only gigs of their own artist. Pages: Dashboard, Music (list/show/create/edit), My Profile,
 *   own artist show/edit, Calendar, Playlists, Favorites.
 * USER (listener): read-only music (cannot create/update/delete anything in the catalogue) + own account.
 *   Pages: Dashboard, Music (list/show), Profile, Playlists, Favorites.
 * Every role: own profile (/api/me), own playlists and favorites only (handlers scope them to the caller).
 */
export function decideAccess({ pathname, method, role }: { pathname: string; method: string; role: AppRole }): AccessDecision {
    if (role === "ARTIST_MANAGER") return "allow";
    const isRead = method === "GET" || method === "HEAD";

    if (pathname.startsWith("/api/")) {
        if (startsWithPath(pathname, "/api/me")) return "allow"; // own profile (handler: own fields only)
        // own playlists and favorites for every role (handlers scope them to the caller)
        if (startsWithPath(pathname, "/api/playlists") || startsWithPath(pathname, "/api/favorites")) return "allow";
        if (startsWithPath(pathname, "/api/gigs")) return role === "ARTIST" && isRead ? "allow" : "deny";
        if (startsWithPath(pathname, "/api/auth")) return "allow";
        if (startsWithPath(pathname, "/api/musics")) return isRead || role === "ARTIST" ? "allow" : "deny";
        if (startsWithPath(pathname, "/api/artists")) {
            if (role !== "ARTIST") return "deny";
            // read all, edit one record (handler: only the linked own record); never create/delete
            const isRecord = pathname.startsWith("/api/artists/") && pathname.length > "/api/artists/".length;
            return isRead || (method === "PUT" && isRecord) ? "allow" : "deny";
        }
        return "deny"; // users, activity and unknown paths: ARTIST_MANAGER only
    }

    // pages
    const page = trimSlashes(pathname);
    if (page === "/admin" || ["dashboard", "profile", "playlists", "favorites"].some((p) => startsWithPath(page, `/admin/${p}`))) return "allow";
    if (startsWithPath(page, "/admin/calendar")) return role === "ARTIST" ? "allow" : "deny";
    if (startsWithPath(page, "/admin/music")) {
        if (role === "ARTIST") return "allow";
        return isWriteScreen(page) ? "deny" : "allow";
    }
    if (role === "ARTIST" && (startsWithPath(page, "/admin/artist/show") || startsWithPath(page, "/admin/artist/edit"))) return "allow";
    if (!page.startsWith("/admin")) return "allow"; // public pages are not gated here
    return "deny"; // artists list/create, users, activity
}
