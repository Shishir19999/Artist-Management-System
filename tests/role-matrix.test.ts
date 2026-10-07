import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const getServerSession = vi.fn();
vi.mock("next-auth", () => ({ getServerSession: (...a: unknown[]) => getServerSession(...a) }));
vi.mock("@/app/api/auth/[...nextauth]/options", () => ({ authOptions: {} }));

const db = vi.hoisted(() => {
    const fn = () => vi.fn();
    return {
        artist: { findMany: fn(), findUnique: fn(), create: fn(), update: fn(), delete: fn() },
        music: { findMany: fn(), findUnique: fn(), create: fn(), update: fn(), delete: fn() },
        user: { findMany: fn(), findUnique: fn(), create: fn(), update: fn(), delete: fn() },
        favorite: { deleteMany: fn() },
        activityLog: { create: fn() },
        $transaction: fn(),
    };
});
vi.mock("../prisma/PrismaClient", () => ({ default: db }));
vi.mock("bcrypt", () => ({ default: { compare: vi.fn(), hash: vi.fn(async (p: string) => `hashed:${p}`) } }));

import * as artists from "@/app/api/artists/route";
import * as artistOne from "@/app/api/artists/[artist_id]/route";
import * as musics from "@/app/api/musics/route";
import * as musicOne from "@/app/api/musics/[music_id]/route";
import * as users from "@/app/api/users/route";
import * as userOne from "@/app/api/users/[user_id]/route";
import { decideAccess } from "@/lib/domain/access";
import type { AppRole } from "@/lib/roles";

const as = (role: AppRole, id = "u1") => getServerSession.mockResolvedValue({ user: { id, role, email: "x@example.com", name: "X" } });
const anon = () => getServerSession.mockResolvedValue(null);
const req = (url: string, method = "GET", body?: unknown) =>
    new NextRequest(`http://localhost${url}`, {
        method,
        headers: { "content-type": "application/json" },
        ...(method === "GET" ? {} : { body: JSON.stringify(body) }),
    });
const ctx = (key: string, id: string) => ({ params: Promise.resolve({ [key]: id }) }) as never;

const artistBody = { name: "A", gender: "MALE", first_release_year: "2020", total_albums: 1, address: "KTM" };
const musicBody = { title: "T", album: "Al", genre: "ROCK" };
const userBody = { name: "Bob", email: "bob@x.io", password: "password1" };
const D = new Date("2030-01-01T00:00:00.000Z");
const artistRow = (over = {}) => ({ id: "a1", name: "A", email: "a@x.io", password: "h", createdBy: "m1", userId: "ua", created_at: D, music: [], ...over });
const musicRow = (over = {}) => ({ id: "s1", title: "T", artistId: "a1", artist: { name: "A" }, ...over });

beforeEach(() => {
    getServerSession.mockReset();
    for (const g of Object.values(db)) {
        if (typeof g === "function") g.mockReset();
        else for (const f of Object.values(g)) f.mockReset();
    }
    db.activityLog.create.mockResolvedValue({});
    db.$transaction.mockImplementation(async (ops: unknown[]) => Promise.all(ops));
});

type Row = Record<AppRole, boolean>;
const M: Row = { ARTIST_MANAGER: true, ARTIST: false, USER: false }; // manager only
const MA: Row = { ARTIST_MANAGER: true, ARTIST: true, USER: false };
const ALL: Row = { ARTIST_MANAGER: true, ARTIST: true, USER: true };

// ---------------------------------------------------------------- coarse gate (proxy / sidebar / demo)
describe("decideAccess matrix", () => {
    const allow = (role: AppRole, method: string, pathname: string) => decideAccess({ role, method, pathname }) === "allow";

    const apiCases: Array<[string, string, Row]> = [
        ["GET", "/api/users", M],
        ["POST", "/api/users", M],
        ["GET", "/api/users/u1", M],
        ["PUT", "/api/users/u1", M],
        ["DELETE", "/api/users/u1", M],
        ["GET", "/api/artists", MA],
        ["GET", "/api/artists/a1", MA],
        ["POST", "/api/artists", M],
        ["PUT", "/api/artists/a1", MA],
        ["DELETE", "/api/artists/a1", M],
        ["GET", "/api/musics", ALL],
        ["GET", "/api/musics/s1", ALL],
        ["POST", "/api/musics", MA],
        ["PUT", "/api/musics/s1", MA],
        ["DELETE", "/api/musics/s1", MA],
        ["GET", "/api/me", ALL],
        ["PUT", "/api/me", ALL],
        ["GET", "/api/gigs", MA],
        ["GET", "/api/gigs/g1", MA],
        ["POST", "/api/gigs", M],
        ["PUT", "/api/gigs/g1", M],
        ["DELETE", "/api/gigs/g1", M],
        ["GET", "/api/playlists", ALL],
        ["POST", "/api/playlists", ALL],
        ["PUT", "/api/playlists/p1", ALL],
        ["DELETE", "/api/playlists/p1", ALL],
        ["GET", "/api/favorites", ALL],
        ["POST", "/api/favorites", ALL],
        ["GET", "/api/activity", M],
        ["GET", "/api/unknown", M],
        ["GET", "/api/artistsx", M],
    ];
    for (const [method, path, expected] of apiCases) {
        it(`${method} ${path}`, () => {
            for (const role of Object.keys(expected) as AppRole[]) expect(allow(role, method, path), role).toBe(expected[role]);
        });
    }

    const pageCases: Array<[string, Row]> = [
        ["/admin", ALL],
        ["/admin/dashboard", ALL],
        ["/admin/profile", ALL],
        ["/admin/music", ALL],
        ["/admin/music/show/s1", ALL],
        ["/admin/music/create", MA],
        ["/admin/music/edit/s1", MA],
        ["/admin/artist", M],
        ["/admin/artist/create", M],
        ["/admin/artist/show/a1", MA],
        ["/admin/artist/edit/a1", MA],
        ["/admin/user", M],
        ["/admin/user/create", M],
        ["/admin/user/edit/u1", M],
        ["/admin/calendar", MA],
        ["/admin/playlists", ALL],
        ["/admin/favorites", ALL],
        ["/admin/activity", M],
    ];
    for (const [path, expected] of pageCases) {
        it(`page ${path}`, () => {
            for (const role of Object.keys(expected) as AppRole[]) expect(allow(role, "GET", path), role).toBe(expected[role]);
        });
    }

    it("HEAD counts as a read", () => {
        expect(allow("USER", "HEAD", "/api/musics")).toBe(true);
        expect(allow("USER", "HEAD", "/api/artists")).toBe(false);
    });
});

// ---------------------------------------------------------------- route handlers
describe("unauthenticated -> 401", () => {
    it("every endpoint family", async () => {
        anon();
        const calls = [
            users.GET(),
            artists.GET(),
            musics.GET(),
            artistOne.GET(req("/api/artists/a1"), ctx("artist_id", "a1")),
            musicOne.GET(req("/api/musics/s1"), ctx("music_id", "s1")),
            userOne.GET(req("/api/users/u1"), ctx("user_id", "u1")),
        ];
        for (const r of await Promise.all(calls)) expect(r.status).toBe(401);
    });
});

describe("users: ARTIST_MANAGER only", () => {
    it("ARTIST and USER get 403 on every users endpoint", async () => {
        for (const role of ["ARTIST", "USER"] as const) {
            as(role, "u1");
            expect((await users.GET()).status).toBe(403);
            expect((await users.POST(req("/api/users", "POST", userBody))).status).toBe(403);
            expect((await userOne.GET(req("/api/users/u1"), ctx("user_id", "u1"))).status).toBe(403); // not even their own record
            expect((await userOne.PUT(req("/api/users/u2", "PUT", userBody), ctx("user_id", "u2"))).status).toBe(403);
            expect((await userOne.DELETE(req("/api/users/u2", "DELETE"), ctx("user_id", "u2"))).status).toBe(403);
        }
        expect(db.user.create).not.toHaveBeenCalled();
    });
    it("the manager lists users without password hashes and may assign any role", async () => {
        as("ARTIST_MANAGER", "m1");
        db.user.findMany.mockResolvedValue([{ id: "u2", password: "hash", tokenVersion: 1, role: "USER" }]);
        const body = await (await users.GET()).json();
        expect(JSON.stringify(body)).not.toContain("hash");
        db.user.findUnique.mockResolvedValue(null);
        db.user.create.mockImplementation(async ({ data }) => ({ id: "n1", ...data }));
        db.artist.findUnique.mockResolvedValue(null);
        db.artist.create.mockResolvedValue({ id: "a9" });
        for (const role of ["USER", "ARTIST", "ARTIST_MANAGER"]) {
            const res = await users.POST(req("/api/users", "POST", { ...userBody, role }));
            expect(res.status).toBe(200);
            expect((await res.json()).data.role).toBe(role);
        }
        expect((await users.POST(req("/api/users", "POST", { ...userBody, role: "ADMIN" }))).status).toBe(400);
    });
    it("creating a user with role ARTIST also creates the linked artist record", async () => {
        as("ARTIST_MANAGER", "m1");
        db.user.findUnique.mockResolvedValue(null);
        db.user.create.mockImplementation(async ({ data }) => ({ id: "n1", ...data }));
        db.artist.findUnique.mockResolvedValue(null);
        db.artist.create.mockResolvedValue({ id: "a9" });
        await users.POST(req("/api/users", "POST", { ...userBody, role: "ARTIST" }));
        expect(db.artist.create.mock.calls[0][0].data).toMatchObject({ userId: "n1", name: "Bob" });
    });
    it("the manager cannot demote or delete themselves", async () => {
        as("ARTIST_MANAGER", "m1");
        db.user.findUnique.mockResolvedValueOnce({ id: "m1", role: "ARTIST_MANAGER" }).mockResolvedValueOnce(null);
        const res = await userOne.PUT(req("/api/users/m1", "PUT", { ...userBody, role: "USER" }), ctx("user_id", "m1"));
        expect(res.status).toBe(400);
        expect((await userOne.DELETE(req("/api/users/m1", "DELETE"), ctx("user_id", "m1"))).status).toBe(400);
    });
});

describe("artists", () => {
    it("USER gets 403 everywhere", async () => {
        as("USER");
        expect((await artists.GET()).status).toBe(403);
        expect((await artists.POST(req("/api/artists", "POST", artistBody))).status).toBe(403);
        expect((await artistOne.GET(req("/api/artists/a1"), ctx("artist_id", "a1"))).status).toBe(403);
        expect((await artistOne.PUT(req("/api/artists/a1", "PUT", artistBody), ctx("artist_id", "a1"))).status).toBe(403);
        expect((await artistOne.DELETE(req("/api/artists/a1", "DELETE"), ctx("artist_id", "a1"))).status).toBe(403);
    });
    it("ARTIST reads all artists: public details of others (no email/owner), full detail of their own", async () => {
        as("ARTIST", "ua");
        db.artist.findMany.mockResolvedValue([artistRow(), artistRow({ id: "a2", userId: "other", email: "o@x.io", createdBy: "m1" })]);
        db.artist.findUnique.mockResolvedValue(artistRow({ id: "a1" }));
        db.artist.findUnique.mockImplementation(async ({ where }: { where: { userId?: string } }) => (where.userId ? { id: "a1" } : artistRow({ id: "a2", userId: "other" })));
        const list = (await (await artists.GET()).json()).artists;
        expect(list[0]).toHaveProperty("email");
        expect(list[1]).not.toHaveProperty("email");
        expect(list[1]).not.toHaveProperty("createdBy");
        expect(JSON.stringify(list)).not.toContain('"password"');
        const one = (await (await artistOne.GET(req("/api/artists/a2"), ctx("artist_id", "a2"))).json()).artist;
        expect(one).not.toHaveProperty("email");
    });
    it("ARTIST cannot create or delete artists", async () => {
        as("ARTIST", "ua");
        expect((await artists.POST(req("/api/artists", "POST", artistBody))).status).toBe(403);
        expect((await artistOne.DELETE(req("/api/artists/a1", "DELETE"), ctx("artist_id", "a1"))).status).toBe(403);
        expect(db.artist.create).not.toHaveBeenCalled();
        expect(db.artist.delete).not.toHaveBeenCalled();
    });
    it("ARTIST may edit only the artist record linked to their account", async () => {
        as("ARTIST", "ua");
        db.artist.findUnique.mockResolvedValue(artistRow({ id: "a2", userId: "other" }));
        expect((await artistOne.PUT(req("/api/artists/a2", "PUT", artistBody), ctx("artist_id", "a2"))).status).toBe(403);
        expect(db.artist.update).not.toHaveBeenCalled();
        db.artist.findUnique.mockResolvedValue(artistRow({ id: "a1", userId: "ua" }));
        db.artist.update.mockResolvedValue(artistRow());
        expect((await artistOne.PUT(req("/api/artists/a1", "PUT", artistBody), ctx("artist_id", "a1"))).status).toBe(200);
        expect(db.artist.update).toHaveBeenCalledTimes(1);
    });
    it("the manager has full CRUD", async () => {
        as("ARTIST_MANAGER", "m1");
        db.artist.create.mockResolvedValue(artistRow());
        expect((await artists.POST(req("/api/artists", "POST", artistBody))).status).toBe(200);
        expect(db.artist.create.mock.calls[0][0].data.createdBy).toBe("m1");
        db.artist.findUnique.mockResolvedValue(artistRow({ userId: "other" }));
        db.artist.update.mockResolvedValue(artistRow());
        expect((await artistOne.PUT(req("/api/artists/a1", "PUT", artistBody), ctx("artist_id", "a1"))).status).toBe(200);
        db.artist.delete.mockResolvedValue(artistRow());
        db.favorite.deleteMany.mockResolvedValue({ count: 0 });
        expect((await artistOne.DELETE(req("/api/artists/a1", "DELETE"), ctx("artist_id", "a1"))).status).toBe(200);
    });
});

describe("musics", () => {
    it("every role lists the whole catalogue with the artist name attached (no ownership filter)", async () => {
        db.music.findMany.mockResolvedValue([musicRow()]);
        db.music.findUnique.mockResolvedValue(musicRow());
        for (const role of ["USER", "ARTIST", "ARTIST_MANAGER"] as const) {
            as(role, "u7");
            db.music.findMany.mockClear();
            const body = await (await musics.GET()).json();
            expect(body.musics[0].artist).toEqual({ name: "A" });
            expect(db.music.findMany.mock.calls[0][0].where).toBeUndefined();
            const one = await musicOne.GET(req("/api/musics/s1"), ctx("music_id", "s1"));
            expect((await one.json()).music.artist).toEqual({ name: "A" });
        }
    });
    it("USER cannot create, update or delete (403)", async () => {
        as("USER");
        expect((await musics.POST(req("/api/musics", "POST", { ...musicBody, artistId: "a1" }))).status).toBe(403);
        expect((await musicOne.PUT(req("/api/musics/s1", "PUT", musicBody), ctx("music_id", "s1"))).status).toBe(403);
        expect((await musicOne.DELETE(req("/api/musics/s1", "DELETE"), ctx("music_id", "s1"))).status).toBe(403);
        expect(db.music.create).not.toHaveBeenCalled();
    });
    it("ARTIST creates music for their own artist only (defaults to it, refuses another)", async () => {
        as("ARTIST", "ua");
        db.artist.findUnique.mockImplementation(async ({ where }: { where: { userId?: string; id?: string } }) =>
            where.userId === "ua" || where.id === "a1" ? { id: "a1" } : null
        );
        db.music.create.mockResolvedValue(musicRow());
        expect((await musics.POST(req("/api/musics", "POST", musicBody))).status).toBe(200);
        expect(db.music.create.mock.calls[0][0].data.artist).toEqual({ connect: { id: "a1" } });
        expect((await musics.POST(req("/api/musics", "POST", { ...musicBody, artistId: "a2" }))).status).toBe(403);
        expect(db.music.create).toHaveBeenCalledTimes(1);
    });
    it("ARTIST without a linked artist record cannot create music", async () => {
        as("ARTIST", "ub");
        db.artist.findUnique.mockResolvedValue(null);
        expect((await musics.POST(req("/api/musics", "POST", musicBody))).status).toBe(403);
    });
    it("ARTIST edits and deletes only music of their own artist", async () => {
        as("ARTIST", "ua");
        db.artist.findUnique.mockResolvedValue({ id: "a1" });
        db.music.findUnique.mockResolvedValue(musicRow({ id: "s2", artistId: "a2" }));
        expect((await musicOne.PUT(req("/api/musics/s2", "PUT", musicBody), ctx("music_id", "s2"))).status).toBe(403);
        expect((await musicOne.DELETE(req("/api/musics/s2", "DELETE"), ctx("music_id", "s2"))).status).toBe(403);
        expect(db.music.update).not.toHaveBeenCalled();
        expect(db.music.delete).not.toHaveBeenCalled();

        db.music.findUnique.mockResolvedValue(musicRow());
        db.music.update.mockResolvedValue(musicRow());
        db.music.delete.mockResolvedValue(musicRow());
        expect((await musicOne.PUT(req("/api/musics/s1", "PUT", musicBody), ctx("music_id", "s1"))).status).toBe(200);
        // cannot move an own song to another artist
        expect((await musicOne.PUT(req("/api/musics/s1", "PUT", { ...musicBody, artistId: "a2" }), ctx("music_id", "s1"))).status).toBe(403);
        expect((await musicOne.DELETE(req("/api/musics/s1", "DELETE"), ctx("music_id", "s1"))).status).toBe(200);
    });
    it("the manager has full CRUD on any artist's music", async () => {
        as("ARTIST_MANAGER", "m1");
        db.artist.findUnique.mockResolvedValue({ id: "a2" });
        db.music.create.mockResolvedValue(musicRow());
        expect((await musics.POST(req("/api/musics", "POST", { ...musicBody, artistId: "a2" }))).status).toBe(200);
        db.music.findUnique.mockResolvedValue(musicRow({ artistId: "a2" }));
        db.music.update.mockResolvedValue(musicRow());
        db.music.delete.mockResolvedValue(musicRow());
        expect((await musicOne.PUT(req("/api/musics/s1", "PUT", musicBody), ctx("music_id", "s1"))).status).toBe(200);
        expect((await musicOne.DELETE(req("/api/musics/s1", "DELETE"), ctx("music_id", "s1"))).status).toBe(200);
    });
});

describe("songs carry artistName for every role", () => {
    it("list, single, create and update payloads include artistName next to artist", async () => {
        db.music.findMany.mockResolvedValue([musicRow(), musicRow({ id: "s2", artist: null, artistId: null })]);
        db.music.findUnique.mockResolvedValue(musicRow());
        db.artist.findUnique.mockResolvedValue({ id: "a1" });
        db.music.create.mockResolvedValue(musicRow());
        db.music.update.mockResolvedValue(musicRow());
        for (const role of ["USER", "ARTIST", "ARTIST_MANAGER"] as const) {
            as(role, "ua");
            const list = (await (await musics.GET()).json()).musics;
            expect(list[0]).toMatchObject({ artistName: "A", artist: { name: "A" } });
            expect(list[1].artistName).toBeNull();
            const one = (await (await musicOne.GET(req("/api/musics/s1"), ctx("music_id", "s1"))).json()).music;
            expect(one).toMatchObject({ artistName: "A", artist: { name: "A" } });
        }
        for (const role of ["ARTIST", "ARTIST_MANAGER"] as const) {
            as(role, "ua");
            expect((await (await musics.POST(req("/api/musics", "POST", { ...musicBody, artistId: "a1" }))).json()).data.artistName).toBe("A");
            expect((await (await musicOne.PUT(req("/api/musics/s1", "PUT", musicBody), ctx("music_id", "s1"))).json()).updatedData.artistName).toBe("A");
        }
    });
    it("an artist's embedded songs carry artistName", async () => {
        as("ARTIST_MANAGER", "m1");
        db.artist.findUnique.mockResolvedValue({ ...artistRow(), music: [{ id: "s1", title: "T" }] });
        const a = (await (await artistOne.GET(req("/api/artists/a1"), ctx("artist_id", "a1"))).json()).artist;
        expect(a.music[0].artistName).toBe("A");
    });
});
