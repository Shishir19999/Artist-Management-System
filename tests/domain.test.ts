import { describe, it, expect } from "vitest";
import { buildAnalytics } from "@/lib/domain/analytics";
import { toCsv, parseCsv, csvToObjects } from "@/lib/domain/csv";
import {
    GigSchema,
    PlaylistSchema,
    ProfileSchema,
    FavoriteSchema,
    cleanOpt,
    dataImage,
    artistExtraFields,
    musicExtraFields,
} from "@/lib/domain/schemas";
import { ArtistSchema } from "@/app/api/artists/ArtistSchema";
import { MusicSchema } from "@/app/api/musics/MusicSchema";
import { dateOnly } from "@/lib/domain/dates";
import { toGigDTO, toPlaylistDTO } from "@/lib/domain/serialize";
import { GENRES } from "@/lib/domain/constants";
import type { GigDTO } from "@/lib/domain/types";

const gig = (over: Partial<GigDTO>): GigDTO => ({
    id: "g",
    artistId: "a1",
    title: "T",
    venue: "V",
    city: null,
    date: "2030-01-01T10:00:00.000Z",
    status: "CONFIRMED",
    fee: null,
    notes: null,
    createdBy: null,
    created_at: "2029-01-01T00:00:00.000Z",
    ...over,
});

describe("buildAnalytics", () => {
    const now = new Date("2026-06-01T00:00:00.000Z");
    const artists = [{ id: "a1", name: "Zed" }, { id: "a2", name: "Amy" }, { id: "a3", name: "Idle" }];
    const songs = [
        { genre: "ROCK" as const, artistId: "a1", releaseDate: "2020-05-01T00:00:00.000Z", durationSec: 100 },
        { genre: "ROCK" as const, artistId: "a1", releaseDate: "2022-05-01T00:00:00.000Z", durationSec: 200 },
        { genre: "POP" as const, artistId: "a2", releaseDate: null, durationSec: null },
        { genre: "POP" as const, artistId: null, releaseDate: "2022-01-01T00:00:00.000Z", durationSec: 50 },
    ];
    const gigs = [
        gig({ id: "g1", date: "2026-08-01T00:00:00.000Z" }),
        gig({ id: "g2", date: "2026-07-01T00:00:00.000Z", status: "HOLD" }),
        gig({ id: "g3", date: "2026-09-01T00:00:00.000Z", status: "CANCELLED" }),
        gig({ id: "g4", date: "2026-10-01T00:00:00.000Z", status: "COMPLETED" }),
        gig({ id: "g5", date: "2025-01-01T00:00:00.000Z" }),
    ];
    const a = buildAnalytics({ artists, songs, gigs, userCount: 7, now });

    it("computes totals", () => {
        expect(a.totals).toEqual({ artists: 3, songs: 4, users: 7, upcomingGigs: 2, totalDurationSec: 350 });
    });
    it("groups songs by genre sorted by count then ties stay stable", () => {
        expect(a.songsByGenre.map((g) => g.count)).toEqual([2, 2]);
        expect(new Set(a.songsByGenre.map((g) => g.genre))).toEqual(new Set(["ROCK", "POP"]));
    });
    it("assigns each artist with songs to their top genre", () => {
        expect(a.artistsByGenre).toEqual(expect.arrayContaining([{ genre: "ROCK", count: 1 }, { genre: "POP", count: 1 }]));
        expect(a.artistsByGenre.reduce((n, g) => n + g.count, 0)).toBe(2); // artist without songs skipped
    });
    it("fills the songs-per-year range with zeros", () => {
        expect(a.songsPerYear).toEqual([
            { year: 2020, count: 1 }, { year: 2021, count: 0 }, { year: 2022, count: 2 },
        ]);
    });
    it("ranks top artists with songs only", () => {
        expect(a.topArtists).toEqual([{ id: "a1", name: "Zed", songs: 2 }, { id: "a2", name: "Amy", songs: 1 }]);
    });
    it("lists upcoming gigs excluding cancelled, completed and past, soonest first", () => {
        expect(a.upcomingGigs.map((g) => g.id)).toEqual(["g2", "g1"]);
    });
    it("handles empty input and null user count", () => {
        const e = buildAnalytics({ artists: [], songs: [], gigs: [], userCount: null, now });
        expect(e.totals).toEqual({ artists: 0, songs: 0, users: null, upcomingGigs: 0, totalDurationSec: 0 });
        expect(e.songsPerYear).toEqual([]);
        expect(e.topArtists).toEqual([]);
    });
});

describe("csv", () => {
    type Row = { name: string; note: string };
    const cols = [{ key: "name" as const, label: "Name" }, { key: "note" as const, label: "Note" }];

    it("round-trips commas, quotes and newlines", () => {
        const rows: Row[] = [{ name: 'He said "hi"', note: "a,b" }, { name: "multi\nline", note: "plain" }];
        const parsed = csvToObjects(parseCsv(toCsv(rows, cols)), cols);
        expect(parsed).toEqual(rows);
    });
    it("quotes fields that need it and uses CRLF", () => {
        const out = toCsv([{ name: "a,b", note: 'x"y' }], cols);
        expect(out).toBe('Name,Note\r\n"a,b","x""y"\r\n');
    });
    it("guards against spreadsheet formula injection and strips the guard on import", () => {
        const evil = ["=SUM(A1)", "+1+1", "@cmd", "-cmd"];
        const out = toCsv(evil.map((name) => ({ name, note: "" })), cols);
        for (const e of evil) expect(out).toContain(`'${e}`);
        const back = csvToObjects(parseCsv(out), cols).map((r) => r.name);
        expect(back).toEqual(evil);
    });
    it("does not guard plain negative numbers", () => {
        expect(toCsv([{ name: "-12.5", note: "" }], cols)).toContain("\r\n-12.5,");
    });
    it("renders null/undefined as empty cells", () => {
        expect(toCsv([{ name: null as unknown as string, note: undefined as unknown as string }], cols)).toBe("Name,Note\r\n,\r\n");
    });
    it("parses LF files, a BOM, escaped quotes and blank lines", () => {
        const rows = parseCsv('﻿Name,Note\n"a ""q"" b",x\n\n,\n');
        expect(rows).toEqual([["Name", "Note"], ['a "q" b', "x"]]);
    });
    it("matches headers by label or key, ignores unknown columns", () => {
        const objs = csvToObjects(parseCsv("NAME,junk,note\nA,zzz,B\n"), cols);
        expect(objs).toEqual([{ name: "A", note: "B" }]);
        expect(csvToObjects(parseCsv("Name\n"), cols)).toEqual([]);
    });
});

describe("domain schemas", () => {
    const tiny = "data:image/png;base64,iVBORw0KGgo=";

    it("cleanOpt: undefined unchanged, empty clears", () => {
        expect(cleanOpt(undefined)).toBeUndefined();
        expect(cleanOpt("")).toBeNull();
        expect(cleanOpt(null)).toBeNull();
        expect(cleanOpt("x")).toBe("x");
        expect(cleanOpt(0)).toBe(0);
    });

    it("dataImage accepts small images and rejects other schemes, bad payloads and oversize", () => {
        expect(dataImage.safeParse(tiny).success).toBe(true);
        expect(dataImage.safeParse(null).success).toBe(true);
        expect(dataImage.safeParse("https://x.example/a.png").success).toBe(false);
        expect(dataImage.safeParse("data:text/html;base64,PGI+").success).toBe(false);
        expect(dataImage.safeParse("javascript:alert(1)").success).toBe(false);
        expect(dataImage.safeParse(`data:image/png;base64,${"A".repeat(150_001)}`).success).toBe(false);
    });

    it("GigSchema applies defaults and validates", () => {
        const ok = GigSchema.parse({ artistId: "a1", title: " Show ", venue: "Hall", date: "2030-05-05T20:00:00.000Z" });
        expect(ok.status).toBe("CONFIRMED");
        expect(ok.title).toBe("Show");
        expect(GigSchema.safeParse({ artistId: "", title: "t", venue: "v", date: "2030-01-01" }).success).toBe(false);
        expect(GigSchema.safeParse({ artistId: "a", title: "t", venue: "v", date: "not a date" }).success).toBe(false);
        expect(GigSchema.safeParse({ artistId: "a", title: "t", venue: "v", date: "2030-01-01", status: "NOPE" }).success).toBe(false);
        expect(GigSchema.safeParse({ artistId: "a", title: "t", venue: "v", date: "2030-01-01", fee: -1 }).success).toBe(false);
        expect(GigSchema.safeParse({ artistId: "a", title: "t", venue: "v", date: "2030-01-01", fee: 1.5 }).success).toBe(false);
    });

    it("PlaylistSchema defaults songIds and validates name", () => {
        expect(PlaylistSchema.parse({ name: "Mix" }).songIds).toEqual([]);
        expect(PlaylistSchema.safeParse({ name: "  " }).success).toBe(false);
        expect(PlaylistSchema.safeParse({ name: "x".repeat(81) }).success).toBe(false);
        expect(PlaylistSchema.safeParse({ name: "ok", songIds: [1] }).success).toBe(false);
    });

    it("FavoriteSchema allows ARTIST and SONG only", () => {
        expect(FavoriteSchema.safeParse({ targetType: "ARTIST", targetId: "a" }).success).toBe(true);
        expect(FavoriteSchema.safeParse({ targetType: "SONG", targetId: "a" }).success).toBe(true);
        expect(FavoriteSchema.safeParse({ targetType: "GIG", targetId: "a" }).success).toBe(false);
        expect(FavoriteSchema.safeParse({ targetType: "SONG", targetId: "" }).success).toBe(false);
    });

    it("ProfileSchema requires the current password for a new one", () => {
        expect(ProfileSchema.safeParse({ name: "Jo" }).success).toBe(true);
        expect(ProfileSchema.safeParse({ name: "J" }).success).toBe(false);
        expect(ProfileSchema.safeParse({ name: "Jo", newPassword: "longenough" }).success).toBe(false);
        expect(ProfileSchema.safeParse({ name: "Jo", newPassword: "short", currentPassword: "x" }).success).toBe(false);
        expect(ProfileSchema.safeParse({ name: "Jo", newPassword: "longenough", currentPassword: "x" }).success).toBe(true);
        expect(ProfileSchema.safeParse({ name: "Jo", gender: "ROBOT" }).success).toBe(false);
    });

    it("ProfileSchema ignores attempts to set role or email", () => {
        const r = ProfileSchema.parse({ name: "Jo", role: "ADMIN", email: "x@example.com" });
        expect(r).not.toHaveProperty("role");
        expect(r).not.toHaveProperty("email");
    });

    it("artist extra fields are optional and accept clearing values", () => {
        const base = { name: "A", gender: "MALE", first_release_year: "2000", total_albums: 1, address: "x" };
        expect(ArtistSchema.safeParse(base).success).toBe(true);
        expect(ArtistSchema.safeParse({ ...base, bio: "hi", photo: tiny, website: "https://a.example", spotify: null, youtube: "" }).success).toBe(true);
        expect(ArtistSchema.safeParse({ ...base, bio: "x".repeat(2001) }).success).toBe(false);
        expect(ArtistSchema.safeParse({ ...base, photo: "http://evil.example/x.png" }).success).toBe(false);
        expect(Object.keys(artistExtraFields)).toEqual(["bio", "photo", "website", "instagram", "youtube", "spotify"]);
    });

    it("music extra fields validate duration and release date", () => {
        const base = { title: "T", album: "A", genre: "POP" };
        expect(MusicSchema.safeParse({ ...base, durationSec: 215, releaseDate: "2020-02-29", coverUrl: tiny }).success).toBe(true);
        expect(MusicSchema.safeParse({ ...base, durationSec: 0 }).success).toBe(false);
        expect(MusicSchema.safeParse({ ...base, durationSec: 7201 }).success).toBe(false);
        expect(MusicSchema.safeParse({ ...base, durationSec: 1.5 }).success).toBe(false);
        expect(MusicSchema.safeParse({ ...base, releaseDate: "02/03/2020" }).success).toBe(false);
        expect(MusicSchema.safeParse({ ...base, releaseDate: "2020-13-45" }).success).toBe(false);
        expect(Object.keys(musicExtraFields)).toEqual(["durationSec", "releaseDate", "coverUrl"]);
    });

    it("music accepts every new genre", () => {
        for (const g of GENRES) expect(MusicSchema.safeParse({ title: "T", album: "A", genre: g }).success).toBe(true);
        expect(MusicSchema.safeParse({ title: "T", album: "A", genre: "POLKA" }).success).toBe(false);
    });
});

describe("serializers and helpers", () => {
    it("dateOnly keeps undefined, clears empties and builds UTC midnight", () => {
        expect(dateOnly(undefined)).toBeUndefined();
        expect(dateOnly(null)).toBeNull();
        expect(dateOnly("")).toBeNull();
        expect(dateOnly("2021-03-04")?.toISOString()).toBe("2021-03-04T00:00:00.000Z");
    });
    it("toGigDTO emits ISO strings and nulls", () => {
        const d = new Date("2030-01-02T03:04:05.000Z");
        const dto = toGigDTO({ id: "g", artistId: "a", title: "t", venue: "v", city: null, date: d, status: "HOLD", fee: null, notes: null, createdBy: null, created_at: d });
        expect(dto).toEqual({
            id: "g", artistId: "a", title: "t", venue: "v", city: null, date: d.toISOString(), status: "HOLD",
            fee: null, notes: null, createdBy: null, created_at: d.toISOString(),
        });
    });
    it("toPlaylistDTO orders songIds by position", () => {
        const d = new Date("2030-01-02T03:04:05.000Z");
        const dto = toPlaylistDTO({
            id: "p", name: "n", description: null, ownerId: "u", created_at: d, updated_at: d,
            items: [{ musicId: "b", position: 1 }, { musicId: "a", position: 0 }, { musicId: "c", position: 2 }],
        });
        expect(dto.songIds).toEqual(["a", "b", "c"]);
        expect(dto.description).toBeNull();
    });
});
