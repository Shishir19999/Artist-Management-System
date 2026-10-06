import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "../../../../../prisma/PrismaClient";
import { RegisterSchema } from "./RegisterSchema";
import { badJson, readJson } from "@/lib/authz";
import { rateLimit } from "@/lib/rate-limit";

const MAX_PER_WINDOW = 10;
const WINDOW_MS = 15 * 60 * 1000;

// PUBLIC endpoint: always creates a USER, whatever the client sends.
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
    const { name, email, password } = parsed.data;

    if (await prisma.user.findUnique({ where: { email } })) {
        return NextResponse.json({ error: "Email is already registered." }, { status: 409 });
    }

    try {
        const user = await prisma.user.create({
            data: { name, email, password: await bcrypt.hash(password, 10), role: "USER" },
        });
        return NextResponse.json({ data: { id: user.id, name: user.name, email: user.email, role: user.role } }, { status: 201 });
    } catch (e) {
        if ((e as { code?: string })?.code === "P2002") {
            return NextResponse.json({ error: "Email is already registered." }, { status: 409 });
        }
        throw e;
    }
}
