import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const findUnique = vi.fn();
const create = vi.fn();
vi.mock("../prisma/PrismaClient", () => ({
    default: {
        user: {
            findUnique: (...a: unknown[]) => findUnique(...a),
            create: (...a: unknown[]) => create(...a),
        },
    },
}));
vi.mock("bcrypt", () => ({ default: { hash: vi.fn(async (p: string) => `hashed:${p}`) } }));
// authz.ts (imported by the route for readJson/badJson) pulls in next-auth options
vi.mock("@/app/api/auth/[...nextauth]/options", () => ({ authOptions: {} }));

import { POST } from "@/app/api/auth/register/route";
import { resetRateLimit } from "@/lib/rate-limit";

const req = (body: unknown, ip = "1.1.1.1", raw?: string) =>
    new NextRequest("http://localhost/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json", "x-forwarded-for": ip },
        body: raw ?? JSON.stringify(body),
    });

const valid = { name: "Jane", email: "j@x.io", password: "password1" };

beforeEach(() => {
    findUnique.mockReset();
    create.mockReset();
    resetRateLimit();
});

describe("POST /api/auth/register", () => {
    it("creates a USER even if the client asks for ADMIN, hashes password, hides hash", async () => {
        findUnique.mockResolvedValue(null);
        create.mockImplementation(async ({ data }) => ({ id: "n1", ...data }));
        const res = await POST(req({ ...valid, email: "J@x.io", role: "ADMIN" }));
        expect(res.status).toBe(201);
        expect(create.mock.calls[0][0].data).toEqual({ name: "Jane", email: "j@x.io", password: "hashed:password1", role: "USER" });
        expect((await res.json()).data).toEqual({ id: "n1", name: "Jane", email: "j@x.io", role: "USER" });
    });
    it("409 when the email exists", async () => {
        findUnique.mockResolvedValue({ id: "e" });
        expect((await POST(req(valid))).status).toBe(409);
        expect(create).not.toHaveBeenCalled();
    });
    it("409 on unique-constraint race", async () => {
        findUnique.mockResolvedValue(null);
        create.mockRejectedValue({ code: "P2002" });
        expect((await POST(req(valid))).status).toBe(409);
    });
    it("400 on invalid body / malformed JSON", async () => {
        expect((await POST(req({ name: "J", email: "bad", password: "x" }))).status).toBe(400);
        expect((await POST(req(null, "1.1.1.1", "{not json"))).status).toBe(400);
    });
    it("429 after too many attempts from one IP", async () => {
        findUnique.mockResolvedValue({ id: "e" });
        let last = 0;
        for (let i = 0; i < 11; i++) last = (await POST(req(valid, "9.9.9.9"))).status;
        expect(last).toBe(429);
    });
});
