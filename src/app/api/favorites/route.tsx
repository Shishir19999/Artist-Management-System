import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../prisma/PrismaClient";
import { authorize, badJson, readJson } from "@/lib/authz";
import { FavoriteSchema } from "@/lib/domain/schemas";

export async function GET() {
    const auth = await authorize(["USER", "ARTIST", "ARTIST_MANAGER"]);
    if (auth.error) return auth.error;

    const rows = await prisma.favorite.findMany({ where: { userId: auth.user.id }, orderBy: { created_at: "asc" } });
    return NextResponse.json(
        { favorites: rows.map((f) => ({ targetType: f.targetType, targetId: f.targetId })) },
        { status: 200 }
    );
}

// Toggle: adds the favorite when missing, removes it when present.
export async function POST(request: NextRequest) {
    const auth = await authorize(["USER", "ARTIST", "ARTIST_MANAGER"]);
    if (auth.error) return auth.error;

    const body = await readJson(request);
    if (body === null) return badJson();

    const parsed = FavoriteSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
    const { targetType, targetId } = parsed.data;

    // USER cannot access artists at all, so only songs can be favorited by that role
    if (targetType === "ARTIST" && auth.user.role === "USER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const visible =
        targetType === "ARTIST"
            ? await prisma.artist.findFirst({ where: { id: targetId }, select: { id: true } })
            : await prisma.music.findFirst({ where: { id: targetId }, select: { id: true } });
    if (!visible) return NextResponse.json({ error: "Not found!" }, { status: 404 });

    const key = { userId: auth.user.id, targetType, targetId };
    const existing = await prisma.favorite.findFirst({ where: key, select: { id: true } });
    if (existing) {
        await prisma.favorite.deleteMany({ where: key });
        return NextResponse.json({ favorited: false }, { status: 200 });
    }
    try {
        await prisma.favorite.create({ data: key });
    } catch (e) {
        // a concurrent request added it first: the end state is still "favorited"
        if ((e as { code?: string })?.code !== "P2002") throw e;
    }
    return NextResponse.json({ favorited: true }, { status: 200 });
}
