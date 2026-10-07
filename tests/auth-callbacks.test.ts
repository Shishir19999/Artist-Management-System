import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Account, Profile, User } from "next-auth";

const findUnique = vi.fn();
const updateMany = vi.fn();
vi.mock("../prisma/PrismaClient", () => ({
    default: {
        user: {
            findUnique: (...a: unknown[]) => findUnique(...a),
            updateMany: (...a: unknown[]) => updateMany(...a),
        },
    },
}));

import { jwtCallback, sessionCallback, signInCallback, signOutEvent } from "@/lib/auth-callbacks";

beforeEach(() => {
    findUnique.mockReset();
    updateMany.mockReset();
});

const google = { provider: "google" } as Account;

describe("signIn callback (Google)", () => {
    it("allows verified Google email", async () => {
        expect(await signInCallback({ account: google, profile: { email: "a@b.c", email_verified: true } as Profile })).toBe(true);
    });
    it("rejects unverified or missing email", async () => {
        expect(await signInCallback({ account: google, profile: { email: "a@b.c", email_verified: false } as Profile })).toBe(false);
        expect(await signInCallback({ account: google, profile: { email_verified: true } as Profile })).toBe(false);
        expect(await signInCallback({ account: google })).toBe(false);
    });
    it("does not interfere with credentials", async () => {
        expect(await signInCallback({ account: { provider: "credentials" } as Account })).toBe(true);
    });
});

describe("jwt callback", () => {
    it("sign-in: id/role/tv come from the DB; a role on the provider user object is ignored", async () => {
        findUnique.mockResolvedValue({ id: "g1", role: "USER", tokenVersion: 4 });
        const token = await jwtCallback({ token: {}, user: { id: "g1", role: "ARTIST_MANAGER" } as User });
        expect(token).toEqual({ id: "g1", role: "USER", tv: 4 });
    });
    it("unknown user at sign-in yields an empty token", async () => {
        findUnique.mockResolvedValue(null);
        expect(await jwtCallback({ token: {}, user: { id: "x" } as User })).toEqual({});
    });
    it("valid token passes and picks up a fresh role", async () => {
        findUnique.mockResolvedValue({ role: "ARTIST_MANAGER", tokenVersion: 2 });
        const t = await jwtCallback({ token: { id: "u", role: "USER", tv: 2 } });
        expect(t).toMatchObject({ id: "u", role: "ARTIST_MANAGER", tv: 2 });
    });
    it("revoked token (version mismatch) is emptied", async () => {
        findUnique.mockResolvedValue({ role: "ARTIST_MANAGER", tokenVersion: 3 });
        expect(await jwtCallback({ token: { id: "u", role: "ARTIST_MANAGER", tv: 2 } })).toEqual({});
    });
    it("deleted user's token is emptied", async () => {
        findUnique.mockResolvedValue(null);
        expect(await jwtCallback({ token: { id: "u", role: "ARTIST_MANAGER", tv: 0 } })).toEqual({});
    });
});

describe("session callback", () => {
    it("copies id and role", async () => {
        const s = await sessionCallback({ session: { user: { name: "n" }, expires: "x" } as never, token: { id: "u", role: "ARTIST_MANAGER" } });
        expect(s.user).toMatchObject({ id: "u", role: "ARTIST_MANAGER" });
    });
    it("revoked token gives empty id; bad role falls back to USER", async () => {
        const s = await sessionCallback({ session: { user: {}, expires: "x" } as never, token: { role: "ROOT" as never } });
        expect(s.user).toMatchObject({ id: "", role: "USER" });
    });
});

describe("tokenVersion / logout", () => {
    it("signOut bumps the version only when the token is still current", async () => {
        await signOutEvent({ token: { id: "u", tv: 5 } });
        expect(updateMany).toHaveBeenCalledWith({
            where: { id: "u", tokenVersion: 5 },
            data: { tokenVersion: { increment: 1 } },
        });
    });
    it("signOut without id/tv does nothing", async () => {
        await signOutEvent({ token: {} });
        expect(updateMany).not.toHaveBeenCalled();
    });
});
