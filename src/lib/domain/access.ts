import type { AppRole } from "@/lib/roles";

export type AccessDecision = "allow" | "deny";

const ALL_ROLES_API = ["/api/me", "/api/playlists", "/api/favorites", "/api/activity"];

const startsWithPath = (pathname: string, base: string) => pathname === base || pathname.startsWith(`${base}/`);

/**
 * Coarse role gate shared by the real middleware (src/proxy.ts) and the browser-only demo.
 * Assumes the caller is authenticated with a valid role. Route handlers still authorize per record.
 *
 * ADMIN: everything. ARTIST_MANAGER: artists/musics/gigs (+ dashboard). USER: read-only own data.
 * Every role may use its own profile, playlists, favorites and activity trail.
 */
export function decideAccess({ pathname, method, role }: { pathname: string; method: string; role: AppRole }): AccessDecision {
    if (role === "ADMIN") return "allow";
    const isRead = method === "GET" || method === "HEAD";

    if (pathname.startsWith("/api/")) {
        if (ALL_ROLES_API.some((b) => startsWithPath(pathname, b))) return "allow";
        if (startsWithPath(pathname, "/api/users")) {
            // non-admins may only read a single user record (handler enforces "own")
            return isRead && pathname !== "/api/users" && pathname !== "/api/users/" ? "allow" : "deny";
        }
        if (["/api/artists", "/api/musics", "/api/gigs"].some((b) => startsWithPath(pathname, b))) {
            return role === "ARTIST_MANAGER" || isRead ? "allow" : "deny";
        }
        return "deny"; // unknown API paths: default deny
    }

    // /admin/** pages
    if (startsWithPath(pathname, "/admin/user")) return "deny";
    if (role === "ARTIST_MANAGER") return "allow";
    // USER: read-only pages only (no create/edit screens), no user management
    if (/\/(create|edit)(\/|$)/.test(pathname)) return "deny";
    return "allow";
}
