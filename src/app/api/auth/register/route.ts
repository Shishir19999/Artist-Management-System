import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "../../../../../prisma/PrismaClient";
import { RegisterSchema } from "./RegisterSchema";
import { badJson, readJson } from "@/lib/authz";
import { rateLimit } from "@/lib/rate-limit";
import { logActivity } from "@/lib/activity";

const MAX_PER_WINDOW = 10;
const WINDOW_MS = 15 * 60 * 1000;

// PUBLIC endpoint: creates a USER (default) or an ARTIST (with an empty linked artist record).
// ARTIST_MANAGER can never be requested here: the schema rejects it.
export async function POST(request: NextRequest) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!rateLimit(`register:${ip}`, MAX_PER_WINDOW, WINDOW_MS)) {
        return NextResponse.json({ error: "Too many attempts, try again later." }, { status: 429 });
    }

    const body = await readJson(request);
    if (body === null) return badJson();

    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
    }
    const { name, email, password, role, phone, address, gender, birthDate } = parsed.data;

    if (await prisma.user.findUnique({ where: { email } })) {
        return NextResponse.json({ error: "Email is already registered." }, { status: 409 });
    }

    try {
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: await bcrypt.hash(password, 10),
                role,
                phone,
                address,
                ...(gender ? { gender } : {}),
                ...(birthDate ? { birthDate: new Date(`${birthDate}T00:00:00.000Z`) } : {}),
                ...(role === "ARTIST" ? { artistProfile: { create: { name, gender: gender ?? "MALE", address: address ?? null } } } : {}),
            },
        });
        await logActivity(user, "REGISTER", "USER", user.id, `${user.name ?? "A new user"} registered`);
        return NextResponse.json({ data: { id: user.id, name: user.name, email: user.email, role: user.role } }, { status: 201 });
    } catch (e) {
        if ((e as { code?: string })?.code === "P2002") {
            return NextResponse.json({ error: "Email is already registered." }, { status: 409 });
        }
        throw e;
    }
}
