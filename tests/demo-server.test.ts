import { describe, it, expect, beforeEach } from "vitest";
import { handleDemoRequest, type DemoRequest } from "@/lib/demo/server";
import { buildSeed, type DemoDb } from "@/lib/demo/seed";
import { parseDuration, durationInput } from "@/lib/domain/duration";
import { monthGrid, dayKey } from "@/lib/domain/calendar";

let db: DemoDb;
beforeEach(() => {
    db = buildSeed(new Date("2026-06-15T12:00:00Z"));
});

const call = (as: string | null, method: string, path: string, body?: unknown): ReturnType<typeof handleDemoRequest> => {
    const [p, q] = path.split("?");
    const req: DemoRequest = { method, path: p, query: new URLSearchParams(q ?? ""), body };
    return handleDemoRequest(db, as, req);
};

const artistBody = { name: "New Act", gender: "FEMALE", first_release_year: "2020", total_albums: 1, address: "Oslo" };

describe("demo seed", () => {
    it("has a realistic catalogue and one account per role", () => {
        expect(db.artists.length).toBeGreaterThanOrEqual(25);
        expect(db.songs.length).toBeGreaterThanOrEqual(110);
        expect(new Set(db.users.map((u) => u.role))).toEqual(new Set(["ADMIN", "ARTIST_MANAGER", "USER"]));
        expect(new Set(db.songs.map((s) => s.id)).size).toBe(db.songs.length);
        for (const s of db.songs) expect(db.artists.some((a) => a.id === s.artistId)).toBe(true);
    });
    it("is deterministic apart from dates", () => {
        const again = buildSeed(new Date("2026-06-15T12:00:00Z"));
        expect(again.songs.map((s) => s.title)).toEqual(db.songs.map((s) => s.title));
    });
});

describe("demo API authorization", () => {
    it("rejects anonymous requests", () => {
        expect(call(null, "GET", "/api/artists").status).toBe(401);
    });
    it("USER sees only own artists and cannot write", () => {
        const list = call("u_user", "GET", "/api/artists").data as { artists: { createdBy: string }[] };
        expect(list.artists.length).toBeGreaterThan(0);
        expect(list.artists.every((a) => a.createdBy === "u_user")).toBe(true);
        expect(call("u_user", "POST", "/api/artists", artistBody).status).toBe(403);
        expect(call("u_user", "GET", "/api/users").status).toBe(403);
        const foreign = db.artists.find((a) => a.createdBy !== "u_user")!;
        expect(call("u_user", "GET", `/api/artists/${foreign.id}`).status).toBe(404);
    });
    it("ARTIST_MANAGER manages artists but not users", () => {
        expect(call("u_manager", "POST", "/api/artists", artistBody).status).toBe(200);
        expect(call("u_manager", "GET", "/api/users").status).toBe(403);
    });
    it("ADMIN manages users, and cannot demote or delete themselves", () => {
        expect(call("u_admin", "GET", "/api/users").status).toBe(200);
        expect(call("u_admin", "PUT", "/api/users/u_admin", { name: "Alex Admin", email: "admin@example.com", role: "USER" }).status).toBe(400);
        expect(call("u_admin", "DELETE", "/api/users/u_admin").status).toBe(400);
    });
});

describe("demo API behaviour", () => {
    it("validates, creates, edits and deletes artists with an audit trail", () => {
        expect(call("u_admin", "POST", "/api/artists", { name: "" }).status).toBe(400);
        const created = call("u_admin", "POST", "/api/artists", artistBody);
        const id = (created.data as { newArtist: { id: string } }).newArtist.id;
        expect(call("u_admin", "PUT", `/api/artists/${id}`, { ...artistBody, name: "Renamed" }).status).toBe(200);
        expect(call("u_admin", "DELETE", `/api/artists/${id}`).status).toBe(200);
        expect(call("u_admin", "GET", `/api/artists/${id}`).status).toBe(404);
        const log = (call("u_admin", "GET", "/api/activity?limit=3").data as { activity: { summary: string }[] }).activity;
        expect(log.map((l) => l.summary)).toContain("Deleted artist Renamed");
    });
    it("unlinks songs and drops gigs and favorites when an artist is deleted", () => {
        const artist = db.artists[0];
        const songCount = db.songs.filter((s) => s.artistId === artist.id).length;
        expect(songCount).toBeGreaterThan(0);
        call("u_admin", "DELETE", `/api/artists/${artist.id}`);
        expect(db.songs.filter((s) => s.artistId === artist.id)).toHaveLength(0);
        expect(db.gigs.some((g) => g.artistId === artist.id)).toBe(false);
        expect(db.songs.length).toBeGreaterThan(100);
    });
    it("creates songs for existing artists only", () => {
        const base = { title: "T", album: "A", genre: "POP", durationSec: 200, releaseDate: "2024-01-02" };
        expect(call("u_manager", "POST", "/api/musics", { ...base, artistId: "nope" }).status).toBe(400);
        expect(call("u_manager", "POST", "/api/musics", { ...base, artistId: "a_1" }).status).toBe(200);
        expect(call("u_manager", "POST", "/api/musics", { ...base, artistId: "a_1", genre: "NOPE" }).status).toBe(400);
    });
    it("toggles favorites per user", () => {
        expect((call("u_manager", "POST", "/api/favorites", { targetType: "ARTIST", targetId: "a_2" }).data as { favorited: boolean }).favorited).toBe(true);
        expect((call("u_manager", "POST", "/api/favorites", { targetType: "ARTIST", targetId: "a_2" }).data as { favorited: boolean }).favorited).toBe(false);
        // the user cannot favorite an artist they cannot see
        expect(call("u_user", "POST", "/api/favorites", { targetType: "ARTIST", targetId: db.artists.find((a) => a.createdBy !== "u_user")!.id }).status).toBe(404);
    });
    it("keeps playlists private to their owner", () => {
        const own = call("u_user", "GET", "/api/playlists/p_1");
        expect(own.status).toBe(200);
        expect(call("u_manager", "GET", "/api/playlists/p_1").status).toBe(404);
        expect(call("u_manager", "DELETE", "/api/playlists/p_1").status).toBe(404);
    });
    it("registers new users as USER only, and rejects duplicates", () => {
        const body = { name: "Pat Doe", email: "pat@example.com", password: "longenough1", role: "ADMIN" };
        expect(call(null, "POST", "/api/auth/register", body).status).toBe(201);
        expect(db.users.find((u) => u.email === "pat@example.com")?.role).toBe("USER");
        expect(call(null, "POST", "/api/auth/register", body).status).toBe(400);
        expect(call(null, "POST", "/api/auth/register", { ...body, email: "x@example.com", password: "short" }).status).toBe(400);
    });
    it("limits non-admin activity to their own entries", () => {
        const rows = (call("u_user", "GET", "/api/activity").data as { activity: { userId: string }[] }).activity;
        expect(rows.every((r) => r.userId === "u_user")).toBe(true);
        expect(call("u_user", "GET", "/api/activity?userId=u_admin").status).toBe(403);
    });
    it("requires the current password to change it", () => {
        expect(call("u_user", "PUT", "/api/me", { name: "Uma User", newPassword: "newpassword1" }).status).toBe(400);
        expect(call("u_user", "PUT", "/api/me", { name: "Uma User", currentPassword: "wrong", newPassword: "newpassword1" }).status).toBe(400);
        const ok = call("u_user", "PUT", "/api/me", { name: "Uma User", currentPassword: "Demo@1234", newPassword: "newpassword1" });
        expect(ok.status).toBe(200);
        expect((ok.data as { signOut?: boolean }).signOut).toBe(true);
    });
});

describe("duration helpers", () => {
    it("parses m:ss, h:mm:ss and plain seconds", () => {
        expect(parseDuration("3:42")).toBe(222);
        expect(parseDuration("1:02:03")).toBe(3723);
        expect(parseDuration("95")).toBe(95);
        expect(parseDuration("3:75")).toBeNull();
        expect(parseDuration("abc")).toBeNull();
    });
    it("formats back", () => {
        expect(durationInput(222)).toBe("3:42");
        expect(durationInput(null)).toBe("");
    });
});

describe("calendar grid", () => {
    it("covers whole Monday-first weeks", () => {
        const cells = monthGrid(2026, 1); // February 2026 starts on a Sunday
        expect(cells.length % 7).toBe(0);
        expect(cells[0].date.getDay()).toBe(1);
        expect(cells.filter((c) => c.inMonth)).toHaveLength(28);
        expect(cells.find((c) => c.inMonth)?.key).toBe("2026-02-01");
        expect(dayKey(new Date(2026, 0, 5))).toBe("2026-01-05");
    });
});
