import { describe, it, expect, vi, beforeEach } from "vitest";

const getServerSession = vi.fn();
vi.mock("next-auth", () => ({ getServerSession: (...a: unknown[]) => getServerSession(...a) }));
vi.mock("@/app/api/auth/[...nextauth]/options", () => ({ authOptions: {} }));

import { authorize } from "@/lib/authz";
import { ROLES, type AppRole } from "@/lib/roles";

const session = (role: AppRole, id = "u1") =>
    getServerSession.mockResolvedValue({ user: { id, role, email: "a@b.c" } });

beforeEach(() => getServerSession.mockReset());

describe("authorize()", () => {
    it("401 without a session", async () => {
        getServerSession.mockResolvedValue(null);
        expect((await authorize(["ADMIN"])).error?.status).toBe(401);
    });
    it("401 for a revoked token (empty id) or unknown role", async () => {
        session("ADMIN", "");
        expect((await authorize(["ADMIN"])).error?.status).toBe(401);
        getServerSession.mockResolvedValue({ user: { id: "u1", role: "ROOT" } });
        expect((await authorize(["ADMIN"])).error?.status).toBe(401);
    });

    // role matrix: which roles may pass each allow-list
    const matrix: Array<[string, AppRole[]]> = [
        ["admin only", ["ADMIN"]],
        ["manager+admin", ["ADMIN", "ARTIST_MANAGER"]],
        ["everyone", ["ADMIN", "ARTIST_MANAGER", "USER"]],
    ];
    for (const [label, allowed] of matrix) {
        for (const role of ROLES) {
            const pass = allowed.includes(role);
            it(`${label}: ${role} -> ${pass ? "allow" : "403"}`, async () => {
                session(role);
                const r = await authorize(allowed);
                if (pass) expect(r.user).toMatchObject({ id: "u1", role });
                else expect(r.error?.status).toBe(403);
            });
        }
    }
});
