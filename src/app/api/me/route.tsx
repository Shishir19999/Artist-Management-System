import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "../../../../prisma/PrismaClient";
import { authorize, badJson, readJson } from "@/lib/authz";
import { ProfileSchema, cleanOpt } from "@/lib/domain/schemas";
import { rateLimit } from "@/lib/rate-limit";
import { logActivity } from "@/lib/activity";

const PW_MAX_ATTEMPTS = 5;
const PW_WINDOW_MS = 15 * 60 * 1000;

const userSelect = { id: true, name: true, email: true, image: true, gender: true, role: true, phone: true, address: true, birthDate: true } as const;

export async function GET() {
    const auth = await authorize(["USER", "ARTIST", "ARTIST_MANAGER"]);
    if (auth.error) return auth.error;

    const user = await prisma.user.findUnique({ where: { id: auth.user.id }, select: userSelect });
    if (!user) return NextResponse.json({ error: "User not found!" }, { status: 404 });
    return NextResponse.json({ user }, { status: 200 });
}

// Own profile only. Role and e-mail can never be changed here.
export async function PUT(request: NextRequest) {
    const auth = await authorize(["USER", "ARTIST", "ARTIST_MANAGER"]);
    if (auth.error) return auth.error;

    const body = await readJson(request);
    if (body === null) return badJson();

    const parsed = ProfileSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
    const data = parsed.data;

    const current = await prisma.user.findUnique({ where: { id: auth.user.id } });
    if (!current) return NextResponse.json({ error: "User not found!" }, { status: 404 });

    let newHash: string | undefined;
    if (data.newPassword) {
        if (!current.password) {
            return NextResponse.json({ error: "This account signs in with Google and has no password to change." }, { status: 400 });
        }
        if (!rateLimit(`profile-password:${current.id}`, PW_MAX_ATTEMPTS, PW_WINDOW_MS)) {
            return NextResponse.json({ error: "Too many attempts, try again later." }, { status: 429 });
        }
        if (!(await bcrypt.compare(data.currentPassword ?? "", current.password))) {
            return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
        }
        newHash = await bcrypt.hash(data.newPassword, 10);
    }

    const updated = await prisma.user.update({
        where: { id: current.id },
        data: {
            name: data.name,
            ...(data.gender ? { gender: data.gender } : {}),
            phone: cleanOpt(data.phone),
            address: cleanOpt(data.address),
            birthDate: data.birthDate == null ? (data.birthDate === null ? null : undefined) : new Date(`${data.birthDate}T00:00:00.000Z`),
            image: cleanOpt(data.image),
            // a password change revokes every existing session
            ...(newHash ? { password: newHash, tokenVersion: { increment: 1 } } : {}),
        },
        select: userSelect,
    });
    await logActivity(
        auth.user,
        "UPDATE",
        "PROFILE",
        updated.id,
        newHash ? "Updated profile and changed password" : "Updated profile"
    );

    return NextResponse.json(newHash ? { user: updated, signOut: true } : { user: updated }, { status: 200 });
}
