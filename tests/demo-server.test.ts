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
        expect(new Set(db.users.map((u) => u.role))).toEqual(new Set(["ARTIST_MANAGER", "ARTIST", "USER"]));
        expect(db.users.filter((u) => u.role === "ARTIST_MANAGER")).toHaveLength(1);
        expect(db.users.filter((u) => u.role === "ARTIST").length).toBeGreaterThan(1);
        expect(db.users.filter((u) => u.role === "USER").length).toBeGreaterThan(1);
        expect(new Set(db.songs.map((s) => s.id)).size).toBe(db.songs.length);
        for (const s of db.songs) expect(db.artists.some((a) => a.id === s.artistId)).toBe(true);
    });
    it("links every Artist account to an artist profile of their own", () => {
        for (const u of db.users.filter((x) => x.role === "ARTIST")) expect(db.artists.some((a) => a.createdBy === u.id)).toBe(true);
    });
    it("is deterministic apart from dates", () => {
        const again = buildSeed(new Date("2026-06-15T12:00:00Z"));
        expect(again.songs.map((s) => s.title)).toEqual(db.songs.map((s) => s.title));
    });
});

const ownSong = () => db.songs.find((s) => s.artistId === "a_1")!;
const otherSong = () => db.songs.find((s) => s.artistId !== "a_1")!;
const songBody = (artistId: string) => ({ title: "T", album: "A", genre: "POP", durationSec: 200, releaseDate: "2024-01-02", artistId });

describe("demo API authorization", () => {
    it("rejects anonymous requests", () => {
        expect(call(null, "GET", "/api/artists").status).toBe(401);
    });
    it("USER browses all music read-only; no artist directory, no bookings, no user management", () => {
        const music = call("u_user", "GET", "/api/musics").data as { musics: { artistName: string | null }[] };
        expect(music.musics.length).toBe(db.songs.length);
        expect(music.musics[0].artistName).toBeTruthy(); // listeners get the artist name with each track
        expect(call("u_user", "GET", "/api/artists").status).toBe(403);
        expect(call("u_user", "POST", "/api/musics", songBody("a_1")).status).toBe(403);
        expect(call("u_user", "DELETE", "/api/musics/s_1").status).toBe(403);
        expect(call("u_user", "GET", "/api/users").status).toBe(403);
        expect(call("u_user", "GET", "/api/gigs").status).toBe(403);
        expect(call("u_user", "GET", "/api/activity").status).toBe(403);
        expect(call("u_user", "POST", "/api/favorites", { targetType: "SONG", targetId: "s_1" }).status).toBe(200);
        expect(call("u_user", "GET", "/api/playlists").status).toBe(200);
    });
    it("ARTIST edits only their own profile and music, and reads the rest", () => {
        expect(call("u_artist", "GET", "/api/musics").status).toBe(200);
        expect(call("u_artist", "GET", "/api/artists").status).toBe(200);
        expect(call("u_artist", "PUT", "/api/artists/a_1", { ...artistBody, name: "Luna Marsh" }).status).toBe(200);
        expect(call("u_artist", "PUT", "/api/artists/a_2", artistBody).status).toBe(403);
        expect(call("u_artist", "POST", "/api/artists", artistBody).status).toBe(403);
        expect(call("u_artist", "DELETE", "/api/artists/a_1").status).toBe(403);
        expect(call("u_artist", "POST", "/api/musics", songBody("a_1")).status).toBe(200);
        expect(call("u_artist", "POST", "/api/musics", songBody("a_2")).status).toBe(403);
        expect(call("u_artist", "PUT", `/api/musics/${ownSong().id}`, songBody("a_1")).status).toBe(200);
        expect(call("u_artist", "PUT", `/api/musics/${otherSong().id}`, songBody("a_1")).status).toBe(403);
        expect(call("u_artist", "DELETE", `/api/musics/${otherSong().id}`).status).toBe(403);
        expect(call("u_artist", "DELETE", `/api/musics/${ownSong().id}`).status).toBe(200);
        expect(call("u_artist", "GET", "/api/users").status).toBe(403);
        expect(call("u_artist", "GET", "/api/favorites").status).toBe(200);
        expect(call("u_artist", "GET", "/api/playlists").status).toBe(200);
    });
    it("ARTIST sees only their own gigs, read-only", () => {
        const list = (call("u_artist", "GET", "/api/gigs").data as { gigs: { artistId: string }[] }).gigs;
        expect(list.length).toBeGreaterThan(0);
        expect(list.every((g) => g.artistId === "a_1")).toBe(true);
        const gig = { artistId: "a_1", title: "Set", venue: "Hall", date: "2026-08-01T19:00:00.000Z", status: "HOLD" };
        expect(call("u_artist", "POST", "/api/gigs", gig).status).toBe(403);
        const own = db.gigs.find((g) => g.artistId === "a_1")!;
        expect(call("u_artist", "PUT", `/api/gigs/${own.id}`, { ...gig, title: "Changed" }).status).toBe(403);
        expect(call("u_artist", "DELETE", `/api/gigs/${own.id}`).status).toBe(403);
    });
    it("ARTIST_MANAGER manages users, artists, music and gigs", () => {
        expect(call("u_manager", "POST", "/api/artists", artistBody).status).toBe(200);
        expect(call("u_manager", "GET", "/api/users").status).toBe(200);
        expect(call("u_manager", "POST", "/api/musics", songBody("a_2")).status).toBe(200);
        expect(call("u_manager", "GET", "/api/gigs").status).toBe(200);
        const gig = { artistId: "a_2", title: "Set", venue: "Hall", date: "2026-08-01T19:00:00.000Z", status: "HOLD" };
        expect(call("u_manager", "POST", "/api/gigs", gig).status).toBe(201);
    });
    it("ARTIST_MANAGER can assign any role, but not change or delete themselves", () => {
        expect(call("u_manager", "PUT", "/api/users/u_user", { name: "Uma User", email: "user@example.com", role: "ARTIST" }).status).toBe(200);
        expect(db.artists.some((a) => a.createdBy === "u_user")).toBe(true);
        expect(call("u_manager", "PUT", "/api/users/u_manager", { name: "Morgan Manager", email: "manager@example.com", role: "USER" }).status).toBe(400);
        expect(call("u_manager", "DELETE", "/api/users/u_manager").status).toBe(400);
    });
    it("keeps user records to the Artist Manager; everyone else uses /api/me", () => {
        expect(call("u_user", "GET", "/api/users/u_user").status).toBe(403);
        expect(call("u_artist", "GET", "/api/users/u_artist").status).toBe(403);
        expect(call("u_artist", "PUT", "/api/users/u_artist", { name: "x", email: "a@example.com" }).status).toBe(403);
        expect(call("u_user", "GET", "/api/me").status).toBe(200);
    });
    it("every role edits its own profile fields through /api/me, never the role or email", () => {
        for (const id of ["u_manager", "u_artist", "u_user"]) {
            const before = db.users.find((u) => u.id === id)!;
            const email = before.email;
            const role = before.role;
            const res = call(id, "PUT", "/api/me", { name: "New Name", phone: "+1 555 0100", address: "Oslo", birthDate: "1990-02-03", gender: "FEMALE", role: "ARTIST_MANAGER", email: "x@example.com" });
            expect(res.status, id).toBe(200);
            expect(db.users.find((u) => u.id === id)).toMatchObject({ name: "New Name", phone: "+1 555 0100", address: "Oslo", birthDate: "1990-02-03", gender: "FEMALE", email, role });
        }
    });
});

describe("demo API behaviour", () => {
    it("validates, creates, edits and deletes artists with an audit trail", () => {
        expect(call("u_manager", "POST", "/api/artists", { name: "" }).status).toBe(400);
        const created = call("u_manager", "POST", "/api/artists", artistBody);
        const id = (created.data as { newArtist: { id: string } }).newArtist.id;
        expect(call("u_manager", "PUT", `/api/artists/${id}`, { ...artistBody, name: "Renamed" }).status).toBe(200);
        expect(call("u_manager", "DELETE", `/api/artists/${id}`).status).toBe(200);
        expect(call("u_manager", "GET", `/api/artists/${id}`).status).toBe(404);
        const log = (call("u_manager", "GET", "/api/activity?limit=3").data as { activity: { summary: string }[] }).activity;
        expect(log.map((l) => l.summary)).toContain("Deleted artist Renamed");
    });
    it("unlinks songs and drops gigs and favorites when an artist is deleted", () => {
        const artist = db.artists[0];
        const songCount = db.songs.filter((s) => s.artistId === artist.id).length;
        expect(songCount).toBeGreaterThan(0);
        call("u_manager", "DELETE", `/api/artists/${artist.id}`);
        expect(db.songs.filter((s) => s.artistId === artist.id)).toHaveLength(0);
        expect(db.gigs.some((g) => g.artistId === artist.id)).toBe(false);
        expect(db.songs.length).toBeGreaterThan(100);
    });
    it("creates songs for existing artists only", () => {
        expect(call("u_manager", "POST", "/api/musics", songBody("nope")).status).toBe(400);
        expect(call("u_manager", "POST", "/api/musics", songBody("a_1")).status).toBe(200);
        expect(call("u_manager", "POST", "/api/musics", { ...songBody("a_1"), genre: "NOPE" }).status).toBe(400);
    });
    it("toggles favorites per listener", () => {
        const fav = { targetType: "SONG", targetId: "s_9" };
        expect((call("u_user", "POST", "/api/favorites", fav).data as { favorited: boolean }).favorited).toBe(true);
        expect((call("u_user", "POST", "/api/favorites", fav).data as { favorited: boolean }).favorited).toBe(false);
        expect(call("u_user", "POST", "/api/favorites", { targetType: "SONG", targetId: "nope" }).status).toBe(404);
    });
    it("keeps playlists private to their owner", () => {
        const own = call("u_user", "GET", "/api/playlists/p_1");
        expect(own.status).toBe(200);
        expect(call("u_artist", "GET", "/api/playlists/p_1").status).toBe(404);
        expect(call("u_artist", "DELETE", "/api/playlists/p_1").status).toBe(404);
        expect(call("u_manager", "GET", "/api/playlists").status).toBe(200);
    });
    const reg = { name: "Pat Doe", email: "pat@example.com", password: "longenough1" };
    it("registers a User, never an Artist Manager, and rejects duplicates", () => {
        expect(call(null, "POST", "/api/auth/register", { ...reg, role: "ARTIST_MANAGER" }).status).toBe(400);
        expect(call(null, "POST", "/api/auth/register", reg).status).toBe(201);
        expect(db.users.find((u) => u.email === "pat@example.com")?.role).toBe("USER");
        expect(call(null, "POST", "/api/auth/register", reg).status).toBe(400);
        expect(call(null, "POST", "/api/auth/register", { ...reg, email: "x@example.com", password: "short" }).status).toBe(400);
    });
    it("registers an Artist with extra details and an empty artist profile", () => {
        const res = call(null, "POST", "/api/auth/register", { ...reg, role: "ARTIST", phone: "+1 555 0100", address: "Oslo", gender: "FEMALE", birthDate: "1995-04-02" });
        expect(res.status).toBe(201);
        const user = db.users.find((u) => u.email === "pat@example.com")!;
        expect(user).toMatchObject({ role: "ARTIST", phone: "+1 555 0100", address: "Oslo", gender: "FEMALE", birthDate: "1995-04-02" });
        const profile = db.artists.find((a) => a.createdBy === user.id)!;
        expect(profile.name).toBe("Pat Doe");
        expect(profile.bio).toBeNull();
    });
    it("keeps the activity trail to the Artist Manager", () => {
        expect(call("u_manager", "GET", "/api/activity").status).toBe(200);
        expect(call("u_user", "GET", "/api/activity").status).toBe(403);
        expect(call("u_artist", "GET", "/api/activity").status).toBe(403);
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
