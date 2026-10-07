import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const getServerSession = vi.fn();
vi.mock("next-auth", () => ({ getServerSession: (...a: unknown[]) => getServerSession(...a) }));
vi.mock("@/app/api/auth/[...nextauth]/options", () => ({ authOptions: {} }));

const db = vi.hoisted(() => {
    const fn = () => vi.fn();
    return {
    gig: { findMany: fn(), findUnique: fn(), create: fn(), update: fn(), delete: fn() },
    artist: { findUnique: fn(), findFirst: fn() },
    music: { findMany: fn(), findFirst: fn() },
    playlist: { findMany: fn(), findUnique: fn(), create: fn(), update: fn(), delete: fn() },
    playlistItem: { deleteMany: fn(), createMany: fn() },
    favorite: { findMany: fn(), findFirst: fn(), create: fn(), deleteMany: fn() },
    activityLog: { findMany: fn(), create: fn() },
    user: { findUnique: fn(), update: fn() },
    $transaction: fn(),
    };
});
vi.mock("../prisma/PrismaClient", () => ({ default: db }));
const bcryptCompare = vi.hoisted(() => vi.fn());
vi.mock("bcrypt", () => ({
    default: { compare: (...a: unknown[]) => bcryptCompare(...a), hash: vi.fn(async (p: string) => `hashed:${p}`) },
}));

import * as gigs from "@/app/api/gigs/route";
import * as gigOne from "@/app/api/gigs/[gig_id]/route";
import * as playlists from "@/app/api/playlists/route";
import * as playlistOne from "@/app/api/playlists/[playlist_id]/route";
import * as favorites from "@/app/api/favorites/route";
import * as activity from "@/app/api/activity/route";
import * as me from "@/app/api/me/route";
import { resetRateLimit } from "@/lib/rate-limit";
import type { AppRole } from "@/lib/roles";

const as = (role: AppRole, id = "u1") =>
    getServerSession.mockResolvedValue({ user: { id, role, email: "u1@example.com", name: "U One" } });
const anon = () => getServerSession.mockResolvedValue(null);

const req = (url: string, method = "GET", body?: unknown, raw?: string) =>
    new NextRequest(`http://localhost${url}`, {
        method,
        headers: { "content-type": "application/json" },
        ...(method === "GET" ? {} : { body: raw ?? JSON.stringify(body) }),
    });
const ctx = (key: string, id: string) => ({ params: Promise.resolve({ [key]: id }) }) as never;

const D = new Date("2030-01-02T03:04:05.000Z");
const gigRow = { id: "g1", artistId: "a1", title: "Show", venue: "Hall", city: null, date: D, status: "CONFIRMED", fee: null, notes: null, createdBy: "m1", created_at: D, updated_at: D };
const validGig = { artistId: "a1", title: "Show", venue: "Hall", date: "2030-01-02T03:04:05.000Z" };
const plRow = (over = {}) => ({ id: "p1", name: "Mix", description: null, ownerId: "u1", created_at: D, updated_at: D, items: [{ musicId: "s2", position: 1 }, { musicId: "s1", position: 0 }], ...over });

beforeEach(() => {
    getServerSession.mockReset();
    bcryptCompare.mockReset();
    resetRateLimit();
    for (const group of Object.values(db)) {
        if (typeof group === "function") group.mockReset();
        else for (const f of Object.values(group)) f.mockReset();
    }
    db.activityLog.create.mockResolvedValue({});
    db.$transaction.mockImplementation(async (ops: unknown[]) => Promise.all(ops));
});

describe("authentication and role gates", () => {
    const calls: Array<[string, () => Promise<Response>]> = [
        ["GET /api/gigs", () => gigs.GET(req("/api/gigs"))],
        ["POST /api/gigs", () => gigs.POST(req("/api/gigs", "POST", validGig))],
        ["GET /api/gigs/:id", () => gigOne.GET(req("/api/gigs/g1"), ctx("gig_id", "g1"))],
        ["PUT /api/gigs/:id", () => gigOne.PUT(req("/api/gigs/g1", "PUT", validGig), ctx("gig_id", "g1"))],
        ["DELETE /api/gigs/:id", () => gigOne.DELETE(req("/api/gigs/g1", "DELETE"), ctx("gig_id", "g1"))],
        ["GET /api/playlists", () => playlists.GET()],
        ["POST /api/playlists", () => playlists.POST(req("/api/playlists", "POST", { name: "x" }))],
        ["GET /api/playlists/:id", () => playlistOne.GET(req("/api/playlists/p1"), ctx("playlist_id", "p1"))],
        ["PUT /api/playlists/:id", () => playlistOne.PUT(req("/api/playlists/p1", "PUT", { name: "x" }), ctx("playlist_id", "p1"))],
        ["DELETE /api/playlists/:id", () => playlistOne.DELETE(req("/api/playlists/p1", "DELETE"), ctx("playlist_id", "p1"))],
        ["GET /api/favorites", () => favorites.GET()],
        ["POST /api/favorites", () => favorites.POST(req("/api/favorites", "POST", { targetType: "ARTIST", targetId: "a1" }))],
        ["GET /api/activity", () => activity.GET(req("/api/activity"))],
        ["GET /api/me", () => me.GET()],
        ["PUT /api/me", () => me.PUT(req("/api/me", "PUT", { name: "Joe" }))],
    ];
    for (const [label, call] of calls) {
        it(`${label} -> 401 when unauthenticated`, async () => {
            anon();
            expect((await call()).status).toBe(401);
        });
    }

    it("USER cannot write gigs (403)", async () => {
        as("USER");
        expect((await gigs.POST(req("/api/gigs", "POST", validGig))).status).toBe(403);
        expect((await gigOne.PUT(req("/api/gigs/g1", "PUT", validGig), ctx("gig_id", "g1"))).status).toBe(403);
        expect((await gigOne.DELETE(req("/api/gigs/g1", "DELETE"), ctx("gig_id", "g1"))).status).toBe(403);
        expect(db.gig.create).not.toHaveBeenCalled();
    });
});

describe("gigs", () => {
    it("manager sees all gigs, filtered by artistId, newest dates serialised as ISO", async () => {
        as("ARTIST_MANAGER", "m1");
        db.gig.findMany.mockResolvedValue([gigRow]);
        const res = await gigs.GET(req("/api/gigs?artistId=a1"));
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.total_count).toBe(1);
        expect(body.gigs[0].date).toBe(D.toISOString());
        expect(body.gigs[0]).not.toHaveProperty("updated_at");
        expect(db.gig.findMany.mock.calls[0][0].where).toEqual({ artistId: "a1" });
    });
    it("USER only reads gigs of artists they created", async () => {
        as("USER", "u9");
        db.gig.findMany.mockResolvedValue([]);
        await gigs.GET(req("/api/gigs"));
        expect(db.gig.findMany.mock.calls[0][0].where).toEqual({ artist: { createdBy: "u9" } });
    });
    it("USER gets 404 for a gig of someone else's artist", async () => {
        as("USER", "u9");
        db.gig.findUnique.mockResolvedValue({ ...gigRow, artist: { createdBy: "other" } });
        expect((await gigOne.GET(req("/api/gigs/g1"), ctx("gig_id", "g1"))).status).toBe(404);
    });
    it("POST validates the body (400 with issues) and malformed JSON", async () => {
        as("ARTIST_MANAGER", "m1");
        const bad = await gigs.POST(req("/api/gigs", "POST", { title: "x" }));
        expect(bad.status).toBe(400);
        expect(Array.isArray((await bad.json()).error)).toBe(true);
        expect((await gigs.POST(req("/api/gigs", "POST", undefined, "{nope"))).status).toBe(400);
    });
    it("POST rejects an unknown artist with 400", async () => {
        as("ADMIN", "a0");
        db.artist.findUnique.mockResolvedValue(null);
        expect((await gigs.POST(req("/api/gigs", "POST", validGig))).status).toBe(400);
        expect(db.gig.create).not.toHaveBeenCalled();
    });
    it("POST creates the gig, records createdBy from the session and logs activity", async () => {
        as("ARTIST_MANAGER", "m1");
        db.artist.findUnique.mockResolvedValue({ id: "a1", name: "Aurora Vale" });
        db.gig.create.mockResolvedValue(gigRow);
        const res = await gigs.POST(req("/api/gigs", "POST", { ...validGig, createdBy: "evil" }));
        expect(res.status).toBe(201);
        expect((await res.json()).gig.id).toBe("g1");
        const data = db.gig.create.mock.calls[0][0].data;
        expect(data.createdBy).toBe("m1");
        expect(data.status).toBe("CONFIRMED");
        expect(db.activityLog.create.mock.calls[0][0].data).toMatchObject({ userId: "m1", action: "CREATE", entity: "GIG" });
    });
    it("PUT / DELETE return 404 for a missing gig", async () => {
        as("ARTIST_MANAGER", "m1");
        db.gig.findUnique.mockResolvedValue(null);
        expect((await gigOne.PUT(req("/api/gigs/x", "PUT", validGig), ctx("gig_id", "x"))).status).toBe(404);
        expect((await gigOne.DELETE(req("/api/gigs/x", "DELETE"), ctx("gig_id", "x"))).status).toBe(404);
    });
    it("DELETE removes the gig", async () => {
        as("ADMIN", "a0");
        db.gig.findUnique.mockResolvedValue(gigRow);
        db.gig.delete.mockResolvedValue(gigRow);
        expect((await gigOne.DELETE(req("/api/gigs/g1", "DELETE"), ctx("gig_id", "g1"))).status).toBe(200);
        expect(db.gig.delete).toHaveBeenCalledWith({ where: { id: "g1" } });
    });
});

describe("playlists", () => {
    it("lists only the caller's playlists with ordered songIds", async () => {
        as("USER", "u1");
        db.playlist.findMany.mockResolvedValue([plRow()]);
        const body = await (await playlists.GET()).json();
        expect(db.playlist.findMany.mock.calls[0][0].where).toEqual({ ownerId: "u1" });
        expect(body.playlists[0].songIds).toEqual(["s1", "s2"]);
    });
    it("returns 404 for another user's playlist on GET/PUT/DELETE, even for admins", async () => {
        as("ADMIN", "a0");
        db.playlist.findUnique.mockResolvedValue(plRow({ ownerId: "someone-else" }));
        expect((await playlistOne.GET(req("/api/playlists/p1"), ctx("playlist_id", "p1"))).status).toBe(404);
        expect((await playlistOne.PUT(req("/api/playlists/p1", "PUT", { name: "n" }), ctx("playlist_id", "p1"))).status).toBe(404);
        expect((await playlistOne.DELETE(req("/api/playlists/p1", "DELETE"), ctx("playlist_id", "p1"))).status).toBe(404);
        expect(db.playlist.delete).not.toHaveBeenCalled();
    });
    it("POST validates the name", async () => {
        as("USER", "u1");
        const res = await playlists.POST(req("/api/playlists", "POST", { name: "" }));
        expect(res.status).toBe(400);
    });
    it("POST rejects songs the user cannot see (Unknown song)", async () => {
        as("USER", "u1");
        db.music.findMany.mockResolvedValue([{ id: "s1" }]); // s2 is not visible
        const res = await playlists.POST(req("/api/playlists", "POST", { name: "Mix", songIds: ["s1", "s2"] }));
        expect(res.status).toBe(400);
        expect((await res.json()).error).toBe("Unknown song");
        expect(db.music.findMany.mock.calls[0][0].where).toEqual({ id: { in: ["s1", "s2"] }, artist: { createdBy: "u1" } });
        expect(db.playlist.create).not.toHaveBeenCalled();
    });
    it("managers may use any song", async () => {
        as("ARTIST_MANAGER", "m1");
        db.music.findMany.mockResolvedValue([{ id: "s1" }]);
        db.playlist.create.mockResolvedValue(plRow({ ownerId: "m1", items: [{ musicId: "s1", position: 0 }] }));
        const res = await playlists.POST(req("/api/playlists", "POST", { name: "Mix", songIds: ["s1"] }));
        expect(res.status).toBe(201);
        expect(db.music.findMany.mock.calls[0][0].where).toEqual({ id: { in: ["s1"] } });
    });
    it("de-duplicates song ids keeping order and stores positions", async () => {
        as("ADMIN", "a0");
        db.music.findMany.mockResolvedValue([{ id: "b" }, { id: "a" }]);
        db.playlist.create.mockResolvedValue(plRow({ ownerId: "a0", items: [] }));
        await playlists.POST(req("/api/playlists", "POST", { name: "Mix", songIds: ["b", "a", "b"] }));
        expect(db.music.findMany.mock.calls[0][0].where.id).toEqual({ in: ["b", "a"] });
        expect(db.playlist.create.mock.calls[0][0].data.items.create).toEqual([
            { musicId: "b", position: 0 }, { musicId: "a", position: 1 },
        ]);
        expect(db.playlist.create.mock.calls[0][0].data.ownerId).toBe("a0");
    });
    it("PUT replaces songs inside one transaction", async () => {
        as("USER", "u1");
        db.playlist.findUnique.mockResolvedValue(plRow());
        db.music.findMany.mockResolvedValue([{ id: "s3" }, { id: "s1" }]);
        db.playlistItem.deleteMany.mockReturnValue("del");
        db.playlistItem.createMany.mockReturnValue("many");
        db.playlist.update.mockReturnValue(plRow({ items: [{ musicId: "s3", position: 0 }, { musicId: "s1", position: 1 }] }));
        const res = await playlistOne.PUT(req("/api/playlists/p1", "PUT", { name: "Mix2", songIds: ["s3", "s1"] }), ctx("playlist_id", "p1"));
        expect(res.status).toBe(200);
        expect(db.$transaction).toHaveBeenCalledTimes(1);
        expect(db.playlistItem.createMany.mock.calls[0][0].data).toEqual([
            { playlistId: "p1", musicId: "s3", position: 0 }, { playlistId: "p1", musicId: "s1", position: 1 },
        ]);
        expect((await res.json()).playlist.songIds).toEqual(["s3", "s1"]);
    });
    it("DELETE removes an owned playlist", async () => {
        as("USER", "u1");
        db.playlist.findUnique.mockResolvedValue(plRow());
        db.playlist.delete.mockResolvedValue({});
        expect((await playlistOne.DELETE(req("/api/playlists/p1", "DELETE"), ctx("playlist_id", "p1"))).status).toBe(200);
    });
});

describe("favorites", () => {
    it("lists only own favorites in DTO shape", async () => {
        as("USER", "u1");
        db.favorite.findMany.mockResolvedValue([{ id: "f", userId: "u1", targetType: "SONG", targetId: "s1", created_at: D }]);
        const body = await (await favorites.GET()).json();
        expect(body).toEqual({ favorites: [{ targetType: "SONG", targetId: "s1" }] });
        expect(db.favorite.findMany.mock.calls[0][0].where).toEqual({ userId: "u1" });
    });
    it("validates the body", async () => {
        as("USER", "u1");
        expect((await favorites.POST(req("/api/favorites", "POST", { targetType: "GIG", targetId: "x" }))).status).toBe(400);
        expect((await favorites.POST(req("/api/favorites", "POST", undefined, "oops"))).status).toBe(400);
    });
    it("404 when the target is not visible to a USER", async () => {
        as("USER", "u1");
        db.artist.findFirst.mockResolvedValue(null);
        const res = await favorites.POST(req("/api/favorites", "POST", { targetType: "ARTIST", targetId: "a9" }));
        expect(res.status).toBe(404);
        expect(db.artist.findFirst.mock.calls[0][0].where).toEqual({ id: "a9", createdBy: "u1" });
    });
    it("songs of foreign artists are not favoritable by a USER", async () => {
        as("USER", "u1");
        db.music.findFirst.mockResolvedValue(null);
        const res = await favorites.POST(req("/api/favorites", "POST", { targetType: "SONG", targetId: "s9" }));
        expect(res.status).toBe(404);
        expect(db.music.findFirst.mock.calls[0][0].where).toEqual({ id: "s9", artist: { createdBy: "u1" } });
    });
    it("toggles on, then off", async () => {
        as("ARTIST_MANAGER", "m1");
        db.artist.findFirst.mockResolvedValue({ id: "a1" });
        db.favorite.findFirst.mockResolvedValueOnce(null);
        db.favorite.create.mockResolvedValue({});
        const on = await favorites.POST(req("/api/favorites", "POST", { targetType: "ARTIST", targetId: "a1" }));
        expect(await on.json()).toEqual({ favorited: true });
        expect(db.artist.findFirst.mock.calls[0][0].where).toEqual({ id: "a1" });

        db.favorite.findFirst.mockResolvedValueOnce({ id: "f1" });
        db.favorite.deleteMany.mockResolvedValue({ count: 1 });
        const off = await favorites.POST(req("/api/favorites", "POST", { targetType: "ARTIST", targetId: "a1" }));
        expect(await off.json()).toEqual({ favorited: false });
    });
});

describe("activity", () => {
    const row = { id: "l1", userId: "u1", userName: "U", action: "CREATE", entity: "ARTIST", entityId: "a1", summary: "Created artist X", created_at: D };
    it("non-admins only get their own rows, default limit 50", async () => {
        as("USER", "u1");
        db.activityLog.findMany.mockResolvedValue([row]);
        const res = await activity.GET(req("/api/activity"));
        const arg = db.activityLog.findMany.mock.calls[0][0];
        expect(arg.where).toEqual({ userId: "u1" });
        expect(arg.take).toBe(50);
        expect(arg.orderBy).toEqual({ created_at: "desc" });
        expect((await res.json()).activity[0].created_at).toBe(D.toISOString());
    });
    it("non-admins asking for a foreign userId get 403", async () => {
        as("ARTIST_MANAGER", "m1");
        expect((await activity.GET(req("/api/activity?userId=other"))).status).toBe(403);
        expect(db.activityLog.findMany).not.toHaveBeenCalled();
    });
    it("non-admins may pass their own userId", async () => {
        as("ARTIST_MANAGER", "m1");
        db.activityLog.findMany.mockResolvedValue([]);
        expect((await activity.GET(req("/api/activity?userId=m1"))).status).toBe(200);
        expect(db.activityLog.findMany.mock.calls[0][0].where).toEqual({ userId: "m1" });
    });
    it("admin sees everything and may filter by user", async () => {
        as("ADMIN", "a0");
        db.activityLog.findMany.mockResolvedValue([]);
        await activity.GET(req("/api/activity"));
        expect(db.activityLog.findMany.mock.calls[0][0].where).toEqual({});
        await activity.GET(req("/api/activity?userId=u5"));
        expect(db.activityLog.findMany.mock.calls[1][0].where).toEqual({ userId: "u5" });
    });
    it("clamps the limit to 1..200 and ignores junk", async () => {
        as("ADMIN", "a0");
        db.activityLog.findMany.mockResolvedValue([]);
        for (const [q, expected] of [["500", 200], ["0", 1], ["-4", 1], ["abc", 50], ["25", 25]] as const) {
            db.activityLog.findMany.mockClear();
            await activity.GET(req(`/api/activity?limit=${q}`));
            expect(db.activityLog.findMany.mock.calls[0][0].take).toBe(expected);
        }
    });
});

describe("/api/me", () => {
    const userRow = { id: "u1", name: "U One", email: "u1@example.com", image: null, gender: "MALE", role: "USER" };

    it("GET returns the caller's safe record", async () => {
        as("USER", "u1");
        db.user.findUnique.mockResolvedValue(userRow);
        const body = await (await me.GET()).json();
        expect(body).toEqual({ user: userRow });
        expect(db.user.findUnique.mock.calls[0][0].where).toEqual({ id: "u1" });
        expect(JSON.stringify(body)).not.toContain("password");
    });
    it("PUT validates the body", async () => {
        as("USER", "u1");
        expect((await me.PUT(req("/api/me", "PUT", { name: "J" }))).status).toBe(400);
        expect((await me.PUT(req("/api/me", "PUT", { name: "Joe", newPassword: "longenough" }))).status).toBe(400);
        expect((await me.PUT(req("/api/me", "PUT", undefined, "{bad"))).status).toBe(400);
    });
    it("PUT updates name/gender only, never role or email, without revoking sessions", async () => {
        as("USER", "u1");
        db.user.findUnique.mockResolvedValue({ id: "u1", password: "h" });
        db.user.update.mockResolvedValue({ ...userRow, name: "Joe" });
        const res = await me.PUT(req("/api/me", "PUT", { name: "Joe", gender: "OTHER", role: "ADMIN", email: "x@example.com" }));
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ user: { ...userRow, name: "Joe" } });
        const data = db.user.update.mock.calls[0][0].data;
        expect(data).toEqual({ name: "Joe", gender: "OTHER", image: undefined });
        expect(data).not.toHaveProperty("tokenVersion");
    });
    it("PUT clears the image with null", async () => {
        as("USER", "u1");
        db.user.findUnique.mockResolvedValue({ id: "u1", password: "h" });
        db.user.update.mockResolvedValue(userRow);
        await me.PUT(req("/api/me", "PUT", { name: "Joe", image: null }));
        expect(db.user.update.mock.calls[0][0].data.image).toBeNull();
    });
    it("PUT rejects a wrong current password", async () => {
        as("USER", "u1");
        db.user.findUnique.mockResolvedValue({ id: "u1", password: "h" });
        bcryptCompare.mockResolvedValue(false);
        const res = await me.PUT(req("/api/me", "PUT", { name: "Joe", currentPassword: "nope", newPassword: "newpass123" }));
        expect(res.status).toBe(400);
        expect((await res.json()).error).toBe("Current password is incorrect");
        expect(db.user.update).not.toHaveBeenCalled();
    });
    it("PUT changes the password, bumps tokenVersion and asks the client to sign out", async () => {
        as("USER", "u1");
        db.user.findUnique.mockResolvedValue({ id: "u1", password: "h" });
        bcryptCompare.mockResolvedValue(true);
        db.user.update.mockResolvedValue(userRow);
        const res = await me.PUT(req("/api/me", "PUT", { name: "Joe", currentPassword: "oldpass", newPassword: "newpass123" }));
        expect(res.status).toBe(200);
        expect((await res.json()).signOut).toBe(true);
        const data = db.user.update.mock.calls[0][0].data;
        expect(data.password).toBe("hashed:newpass123");
        expect(data.tokenVersion).toEqual({ increment: 1 });
    });
    it("PUT refuses to set a password on an account without one (Google)", async () => {
        as("USER", "u1");
        db.user.findUnique.mockResolvedValue({ id: "u1", password: null });
        const res = await me.PUT(req("/api/me", "PUT", { name: "Joe", currentPassword: "x", newPassword: "newpass123" }));
        expect(res.status).toBe(400);
        expect(db.user.update).not.toHaveBeenCalled();
    });
    it("PUT rate-limits password attempts (429 after 5 tries)", async () => {
        as("USER", "u1");
        db.user.findUnique.mockResolvedValue({ id: "u1", password: "h" });
        bcryptCompare.mockResolvedValue(false);
        const body = { name: "Joe", currentPassword: "nope", newPassword: "newpass123" };
        for (let i = 0; i < 5; i++) expect((await me.PUT(req("/api/me", "PUT", body))).status).toBe(400);
        expect((await me.PUT(req("/api/me", "PUT", body))).status).toBe(429);
    });
});
