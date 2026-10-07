import { describe, it, expect, vi } from "vitest";
// authz.ts imports the NextAuth options at load time; stub them
vi.mock("@/app/api/auth/[...nextauth]/options", () => ({ authOptions: {} }));

import { isRole, ROLES } from "@/lib/roles";
import { RegisterSchema } from "@/app/api/auth/register/RegisterSchema";
import { UserSchema, UserUpdateSchema } from "@/app/api/users/UserSchema";
import { isGoogleEnabled } from "@/lib/google-enabled";
import { rateLimit, resetRateLimit } from "@/lib/rate-limit";
import { stripPassword } from "@/lib/authz";

const env = (o: Record<string, string>) => o as unknown as NodeJS.ProcessEnv;

describe("roles", () => {
    it("accepts only known roles", () => {
        for (const r of ROLES) expect(isRole(r)).toBe(true);
        for (const bad of ["admin", "ADMIN", "SUPERADMIN", "", null, undefined, 1]) expect(isRole(bad)).toBe(false);
    });
});

describe("RegisterSchema", () => {
    const ok = { name: "Jane", email: "  Jane@Example.COM ", password: "longenough" };
    it("normalises email, strips unknown keys and defaults the role to USER", () => {
        const r = RegisterSchema.parse({ ...ok, isAdmin: true });
        expect(r).toEqual({ name: "Jane", email: "jane@example.com", password: "longenough", role: "USER" });
    });
    it("accepts USER or ARTIST and never ARTIST_MANAGER (or the old ADMIN)", () => {
        expect(RegisterSchema.parse({ ...ok, role: "ARTIST" }).role).toBe("ARTIST");
        expect(RegisterSchema.parse({ ...ok, role: "" }).role).toBe("USER");
        for (const bad of ["ARTIST_MANAGER", "ADMIN", "root"]) expect(RegisterSchema.safeParse({ ...ok, role: bad }).success).toBe(false);
    });
    it("keeps the optional registration fields (phone, address, gender, birthDate) and validates them", () => {
        const r = RegisterSchema.parse({ ...ok, phone: "+977 98", address: "Kathmandu", gender: "FEMALE", birthDate: "1999-05-17" });
        expect(r).toMatchObject({ phone: "+977 98", address: "Kathmandu", gender: "FEMALE", birthDate: "1999-05-17" });
        expect(RegisterSchema.safeParse({ ...ok, birthDate: "17/05/1999" }).success).toBe(false);
        expect(RegisterSchema.safeParse({ ...ok, birthDate: "2999-01-01" }).success).toBe(false);
        expect(RegisterSchema.safeParse({ ...ok, gender: "X" }).success).toBe(false);
    });
    it("rejects short password, bad email, short name, >72 char password", () => {
        expect(RegisterSchema.safeParse({ ...ok, password: "short" }).success).toBe(false);
        expect(RegisterSchema.safeParse({ ...ok, email: "nope" }).success).toBe(false);
        expect(RegisterSchema.safeParse({ ...ok, name: "J" }).success).toBe(false);
        expect(RegisterSchema.safeParse({ ...ok, password: "x".repeat(73) }).success).toBe(false);
        expect(RegisterSchema.safeParse({}).success).toBe(false);
    });
});

describe("UserSchema", () => {
    it("validates role enum and makes password optional on update", () => {
        expect(UserSchema.safeParse({ name: "Bob", email: "b@x.io", password: "abc", role: "ARTIST_MANAGER" }).success).toBe(true);
        expect(UserSchema.safeParse({ name: "Bob", email: "b@x.io", password: "abc", role: "ARTIST" }).success).toBe(true);
        expect(UserSchema.safeParse({ name: "Bob", email: "b@x.io", password: "abc", role: "ADMIN" }).success).toBe(false);
        expect(UserSchema.safeParse({ name: "Bob", email: "b@x.io", password: "abc", role: "ROOT" }).success).toBe(false);
        expect(UserSchema.safeParse({ name: "Bob", email: "b@x.io" }).success).toBe(false);
        expect(UserUpdateSchema.safeParse({ name: "Bob", email: "b@x.io" }).success).toBe(true);
    });
});

describe("helpers", () => {
    it("isGoogleEnabled needs both vars", () => {
        expect(isGoogleEnabled(env({}))).toBe(false);
        expect(isGoogleEnabled(env({ GOOGLE_CLIENT_ID: "a" }))).toBe(false);
        expect(isGoogleEnabled(env({ GOOGLE_CLIENT_ID: "a", GOOGLE_CLIENT_SECRET: " " }))).toBe(false);
        expect(isGoogleEnabled(env({ GOOGLE_CLIENT_ID: "a", GOOGLE_CLIENT_SECRET: "b" }))).toBe(true);
    });
    it("rateLimit blocks after max within the window and resets after it", () => {
        resetRateLimit();
        expect([1, 2, 3].map(() => rateLimit("k", 2, 1000, 0))).toEqual([true, true, false]);
        expect(rateLimit("k", 2, 1000, 1001)).toBe(true);
    });
    it("stripPassword removes hash and tokenVersion", () => {
        expect(stripPassword({ id: "1", password: "h", tokenVersion: 3 })).toEqual({ id: "1" });
    });
});
