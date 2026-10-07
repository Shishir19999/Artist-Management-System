import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const getServerSession = vi.fn();
vi.mock("next-auth", () => ({ getServerSession: (...a: unknown[]) => getServerSession(...a) }));
vi.mock("@/app/api/auth/[...nextauth]/options", () => ({ authOptions: {} }));

const db = vi.hoisted(() => {
    const fn = () => vi.fn();
    return {
        artist: { findUnique: fn(), findFirst: fn() },
        music: { findMany: fn(), findFirst: fn() },
        gig: { findMany: fn(), findUnique: fn() },
        playlist: { findMany: fn(), findUnique: fn(), create: fn() },
        favorite: { findMany: fn(), findFirst: fn(), create: fn(), deleteMany: fn() },
        user: { findUnique: fn(), update: fn() },
        activityLog: { create: fn(), findMany: fn() },
        $transaction: fn(),
    };
});
vi.mock("../prisma/PrismaClient", () => ({ default: db }));
vi.mock("bcrypt", () => ({ default: { compare: vi.fn(), hash: vi.fn(async (p: string) => `hashed:${p}`) } }));

import * as gigs from "@/app/api/gigs/route";
import * as gigOne from "@/app/api/gigs/[gig_id]/route";
import * as playlists from "@/app/api/playlists/route";
import * as playlistOne from "@/app/api/playlists/[playlist_id]/route";
import * as favorites from "@/app/api/favorites/route";
import * as me from "@/app/api/me/route";
import * as activity from "@/app/api/activity/route";
import type { AppRole } from "@/lib/roles";

const as = (role: AppRole, id = "u1") => getServerSession.mockResolvedValue({ user: { id, role, email: "x@example.com", name: "X" } });
const req = (url: string, method = "GET", body?: unknown) =>
    new NextRequest(`http://localhost${url}`, {
        method,
        headers: { "content-type": "application/json" },
        ...(method === "GET" ? {} : { body: JSON.stringify(body) }),
    });
const ctx = (key: string, id: string) => ({ params: Promise.resolve({ [key]: id }) }) as never;
const D = new Date("2030-01-01T00:00:00.000Z");
const ROLES = ["USER", "ARTIST", "ARTIST_MANAGER"] as const;

beforeEach(() => {
    getServerSession.mockReset();
    for (const g of Object.values(db)) {
        if (typeof g === "function") g.mockReset();
        else for (const f of Object.values(g)) f.mockReset();
    }
    db.activityLog.create.mockResolvedValue({});
    db.$transaction.mockImplementation(async (ops: unknown[]) => Promise.all(ops));
});

describe("gigs", () => {
    const gigRow = { id: "g1", artistId: "a1", title: "Show", venue: "Hall", city: null, date: D, status: "CONFIRMED", fee: null, notes: null, createdBy: "m1", created_at: D, updated_at: D };
    const body = { artistId: "a1", title: "x", venue: "y", date: "2030-01-02T03:04:05.000Z" };

    it("USER has no access", async () => {
        as("USER");
        expect((await gigs.GET(req("/api/gigs"))).status).toBe(403);
        expect((await gigOne.GET(req("/api/gigs/g1"), ctx("gig_id", "g1"))).status).toBe(403);
    });
    it("ARTIST reads only gigs of their own artist and cannot write", async () => {
        as("ARTIST", "ua");
        db.artist.findUnique.mockResolvedValue({ id: "a1" });
        db.gig.findMany.mockResolvedValue([gigRow]);
        expect((await gigs.GET(req("/api/gigs?artistId=a2"))).status).toBe(200);
        expect(db.gig.findMany).not.toHaveBeenCalled(); // a foreign artistId yields an empty list
        await gigs.GET(req("/api/gigs"));
        expect(db.gig.findMany.mock.calls[0][0].where).toEqual({ artistId: "a1" });
        db.gig.findUnique.mockResolvedValue({ ...gigRow, artistId: "a2" });
        expect((await gigOne.GET(req("/api/gigs/g1"), ctx("gig_id", "g1"))).status).toBe(404);
        db.gig.findUnique.mockResolvedValue(gigRow);
        expect((await gigOne.GET(req("/api/gigs/g1"), ctx("gig_id", "g1"))).status).toBe(200);
        expect((await gigs.POST(req("/api/gigs", "POST", body))).status).toBe(403);
        expect((await gigOne.PUT(req("/api/gigs/g1", "PUT", body), ctx("gig_id", "g1"))).status).toBe(403);
        expect((await gigOne.DELETE(req("/api/gigs/g1", "DELETE"), ctx("gig_id", "g1"))).status).toBe(403);
    });
    it("ARTIST without an artist record sees no gigs", async () => {
        as("ARTIST", "ub");
        db.artist.findUnique.mockResolvedValue(null);
        expect(await (await gigs.GET(req("/api/gigs"))).json()).toEqual({ gigs: [], total_count: 0 });
    });
    it("the manager sees all gigs", async () => {
        as("ARTIST_MANAGER", "m1");
        db.gig.findMany.mockResolvedValue([gigRow]);
        await gigs.GET(req("/api/gigs"));
        expect(db.gig.findMany.mock.calls[0][0].where).toEqual({});
    });
});

describe("own playlists and favorites for every role", () => {
    const plRow = { id: "p1", name: "Mix", description: null, ownerId: "u1", created_at: D, updated_at: D, items: [] };
    for (const role of ROLES) {
        it(`${role}: lists only their own playlists and favorites`, async () => {
            as(role, "u1");
            db.playlist.findMany.mockResolvedValue([plRow]);
            db.favorite.findMany.mockResolvedValue([]);
            expect((await playlists.GET()).status).toBe(200);
            expect(db.playlist.findMany.mock.calls[0][0].where).toEqual({ ownerId: "u1" });
            expect((await favorites.GET()).status).toBe(200);
            expect(db.favorite.findMany.mock.calls[0][0].where).toEqual({ userId: "u1" });
        });
        it(`${role}: cannot read or change someone else's playlist (404)`, async () => {
            as(role, "u1");
            db.playlist.findUnique.mockResolvedValue({ ...plRow, ownerId: "someone" });
            expect((await playlistOne.GET(req("/api/playlists/p1"), ctx("playlist_id", "p1"))).status).toBe(404);
            expect((await playlistOne.PUT(req("/api/playlists/p1", "PUT", { name: "n" }), ctx("playlist_id", "p1"))).status).toBe(404);
            expect((await playlistOne.DELETE(req("/api/playlists/p1", "DELETE"), ctx("playlist_id", "p1"))).status).toBe(404);
        });
        it(`${role}: may put any catalogue song into a playlist`, async () => {
            as(role, "u1");
            db.music.findMany.mockResolvedValue([{ id: "s1" }]);
            db.playlist.create.mockResolvedValue({ ...plRow, items: [{ musicId: "s1", position: 0 }] });
            expect((await playlists.POST(req("/api/playlists", "POST", { name: "Mix", songIds: ["s1"] }))).status).toBe(201);
            expect(db.music.findMany.mock.calls[0][0].where).toEqual({ id: { in: ["s1"] } });
        });
    }
    it("USER may favorite songs but not artists; ARTIST may favorite both", async () => {
        db.favorite.findFirst.mockResolvedValue(null);
        db.favorite.create.mockResolvedValue({});
        db.music.findFirst.mockResolvedValue({ id: "s1" });
        db.artist.findFirst.mockResolvedValue({ id: "a1" });
        as("USER", "u1");
        expect((await favorites.POST(req("/api/favorites", "POST", { targetType: "ARTIST", targetId: "a1" }))).status).toBe(403);
        expect((await favorites.POST(req("/api/favorites", "POST", { targetType: "SONG", targetId: "s1" }))).status).toBe(200);
        expect(db.favorite.create.mock.calls[0][0].data.userId).toBe("u1");
        as("ARTIST", "u2");
        expect((await favorites.POST(req("/api/favorites", "POST", { targetType: "ARTIST", targetId: "a1" }))).status).toBe(200);
    });
});

describe("/api/me", () => {
    const userRow = { id: "u1", name: "U", email: "u1@example.com", image: null, gender: "MALE", role: "USER", phone: null, address: null, birthDate: null };
    for (const role of ROLES) {
        it(`${role} edits own profile fields but never role or e-mail`, async () => {
            as(role, "u1");
            db.user.findUnique.mockResolvedValue({ id: "u1", password: "h" });
            db.user.update.mockResolvedValue({ ...userRow, role });
            const res = await me.PUT(req("/api/me", "PUT", { name: "Joe", phone: "123", address: "KTM", gender: "FEMALE", birthDate: "1999-05-17", role: "ARTIST_MANAGER", email: "evil@x.io" }));
            expect(res.status).toBe(200);
            const data = db.user.update.mock.calls[0][0].data;
            expect(data).toMatchObject({ name: "Joe", phone: "123", address: "KTM", gender: "FEMALE" });
            expect(data.birthDate.toISOString()).toBe("1999-05-17T00:00:00.000Z");
            expect(data).not.toHaveProperty("role");
            expect(data).not.toHaveProperty("email");
        });
    }
});

describe("activity trail stays manager only", () => {
    it("USER and ARTIST get 403", async () => {
        for (const role of ["USER", "ARTIST"] as const) {
            as(role);
            expect((await activity.GET(req("/api/activity"))).status).toBe(403);
        }
    });
});
