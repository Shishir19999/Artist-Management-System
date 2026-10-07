import { describe, expect, it } from "vitest";
import { decideAccess } from "@/lib/domain/access";
import { buildSeed } from "@/lib/demo/seed";
import { handleDemoRequest } from "@/lib/demo/server";
import { ROLES, type AppRole } from "@/lib/roles";

const SELF: Record<AppRole, string> = { ARTIST_MANAGER: "u_manager", ARTIST: "u_artist", USER: "u_user" };

const artist = { name: "Luna Marsh", gender: "FEMALE", first_release_year: "2020", total_albums: 1, address: "Lisbon" };
const song = { title: "T", album: "A", genre: "POP", durationSec: 200, releaseDate: "2024-01-02", artistId: "a_1" };
const gig = { artistId: "a_1", title: "Set", venue: "Hall", date: "2026-08-01T19:00:00.000Z", status: "HOLD" };
const playlist = { name: "Mix", songIds: ["s_1"] };

// requests that would succeed for the role if the coarse gate lets them through (own records, valid bodies)
const requests = (role: AppRole, db: ReturnType<typeof buildSeed>): [string, string, unknown?][] => {
    const own = db.songs.find((s) => s.artistId === "a_1")!.id;
    const self = SELF[role];
    return [
        ["GET", "/api/me"],
        ["PUT", "/api/me", { name: "Someone" }],
        ["GET", "/api/artists"],
        ["GET", "/api/artists/a_1"],
        ["POST", "/api/artists", artist],
        ["PUT", "/api/artists/a_1", artist],
        ["DELETE", "/api/artists/a_26"],
        ["GET", "/api/musics"],
        ["GET", `/api/musics/${own}`],
        ["POST", "/api/musics", song],
        ["PUT", `/api/musics/${own}`, song],
        ["DELETE", `/api/musics/${own}`],
        ["GET", "/api/gigs"],
        ["POST", "/api/gigs", gig],
        ["GET", "/api/users"],
        ["POST", "/api/users", { name: "New Person", email: "new.person@example.com", password: "abc12345" }],
        ["GET", `/api/users/${self}`],
        ["GET", "/api/playlists"],
        ["POST", "/api/playlists", playlist],
        ["GET", "/api/favorites"],
        ["POST", "/api/favorites", { targetType: "SONG", targetId: "s_1" }],
        ["GET", "/api/activity"],
    ];
};

describe("the preview API agrees with src/lib/domain/access.ts", () => {
    for (const role of ROLES) {
        it(`${role}: refuses exactly what the shared matrix denies`, () => {
            const db = buildSeed(new Date("2026-06-15T12:00:00Z"));
            for (const [method, path, body] of requests(role, db)) {
                const url = new URL(path, "http://x");
                const res = handleDemoRequest(db, SELF[role], { method, path: url.pathname, query: url.searchParams, body });
                const denied = decideAccess({ pathname: url.pathname, method, role }) === "deny";
                if (denied) expect(res.status, `${role} ${method} ${path} must be refused`).toBe(403);
                else expect(res.status, `${role} ${method} ${path} must not be refused`).not.toBe(403);
            }
        });
    }
});
