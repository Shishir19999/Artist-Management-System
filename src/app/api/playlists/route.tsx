import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../prisma/PrismaClient";
import { authorize, badJson, readJson } from "@/lib/authz";
import { PlaylistSchema, cleanOpt } from "@/lib/domain/schemas";
import { toPlaylistDTO } from "@/lib/domain/serialize";
import { resolveSongIds } from "@/lib/playlist-songs";
import { logActivity } from "@/lib/activity";

// Every role manages its own playlists only.
export async function GET() {
    const auth = await authorize(["ADMIN", "ARTIST_MANAGER", "USER"]);
    if (auth.error) return auth.error;

    const rows = await prisma.playlist.findMany({
        where: { ownerId: auth.user.id },
        include: { items: { select: { musicId: true, position: true } } },
        orderBy: { created_at: "asc" },
    });
    return NextResponse.json({ playlists: rows.map(toPlaylistDTO) }, { status: 200 });
}

export async function POST(request: NextRequest) {
    const auth = await authorize(["ADMIN", "ARTIST_MANAGER", "USER"]);
    if (auth.error) return auth.error;

    const body = await readJson(request);
    if (body === null) return badJson();

    const parsed = PlaylistSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
    const data = parsed.data;

    const songIds = await resolveSongIds(auth.user, data.songIds);
    if (!songIds) return NextResponse.json({ error: "Unknown song" }, { status: 400 });

    const created = await prisma.playlist.create({
        data: {
            name: data.name,
            description: cleanOpt(data.description),
            ownerId: auth.user.id,
            items: { create: songIds.map((musicId, position) => ({ musicId, position })) },
        },
        include: { items: { select: { musicId: true, position: true } } },
    });
    await logActivity(auth.user, "CREATE", "PLAYLIST", created.id, `Created playlist ${created.name}`);

    return NextResponse.json({ playlist: toPlaylistDTO(created) }, { status: 201 });
}
