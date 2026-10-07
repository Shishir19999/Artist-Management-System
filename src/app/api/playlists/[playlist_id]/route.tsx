import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../prisma/PrismaClient";
import { authorize, badJson, readJson } from "@/lib/authz";
import { PlaylistSchema, cleanOpt } from "@/lib/domain/schemas";
import { toPlaylistDTO } from "@/lib/domain/serialize";
import { resolveSongIds } from "@/lib/playlist-songs";
import { logActivity } from "@/lib/activity";

type Ctx = { params: Promise<{ playlist_id: string }> };

const itemsInclude = { items: { select: { musicId: true, position: true } } } as const;
const notFound = () => NextResponse.json({ error: "Playlist not found!" }, { status: 404 });

// Playlists of other users are reported as 404 (their existence is not disclosed), for every role.
export async function GET(request: NextRequest, props: Ctx) {
    const { playlist_id } = await props.params;
    const auth = await authorize(["ADMIN", "ARTIST_MANAGER", "USER"]);
    if (auth.error) return auth.error;

    const playlist = await prisma.playlist.findUnique({ where: { id: playlist_id }, include: itemsInclude });
    if (!playlist || playlist.ownerId !== auth.user.id) return notFound();
    return NextResponse.json({ playlist: toPlaylistDTO(playlist) }, { status: 200 });
}

export async function PUT(request: NextRequest, props: Ctx) {
    const { playlist_id } = await props.params;
    const auth = await authorize(["ADMIN", "ARTIST_MANAGER", "USER"]);
    if (auth.error) return auth.error;

    const body = await readJson(request);
    if (body === null) return badJson();

    const playlist = await prisma.playlist.findUnique({ where: { id: playlist_id } });
    if (!playlist || playlist.ownerId !== auth.user.id) return notFound();

    const parsed = PlaylistSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
    const data = parsed.data;

    const songIds = await resolveSongIds(auth.user, data.songIds);
    if (!songIds) return NextResponse.json({ error: "Unknown song" }, { status: 400 });

    // songs are replaced atomically
    const [, , updated] = await prisma.$transaction([
        prisma.playlistItem.deleteMany({ where: { playlistId: playlist.id } }),
        prisma.playlistItem.createMany({ data: songIds.map((musicId, position) => ({ playlistId: playlist.id, musicId, position })) }),
        prisma.playlist.update({
            where: { id: playlist.id },
            data: { name: data.name, description: cleanOpt(data.description) },
            include: itemsInclude,
        }),
    ]);
    await logActivity(auth.user, "UPDATE", "PLAYLIST", updated.id, `Updated playlist ${updated.name}`);
    return NextResponse.json({ playlist: toPlaylistDTO(updated) }, { status: 200 });
}

export async function DELETE(request: NextRequest, props: Ctx) {
    const { playlist_id } = await props.params;
    const auth = await authorize(["ADMIN", "ARTIST_MANAGER", "USER"]);
    if (auth.error) return auth.error;

    const playlist = await prisma.playlist.findUnique({ where: { id: playlist_id } });
    if (!playlist || playlist.ownerId !== auth.user.id) return notFound();

    await prisma.playlist.delete({ where: { id: playlist.id } });
    await logActivity(auth.user, "DELETE", "PLAYLIST", playlist.id, `Deleted playlist ${playlist.name}`);
    return NextResponse.json({ msg: "Playlist deleted successfully!" }, { status: 200 });
}
