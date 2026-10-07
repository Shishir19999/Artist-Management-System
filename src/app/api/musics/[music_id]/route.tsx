import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../prisma/PrismaClient";
import { MusicSchema } from "../MusicSchema";
import { authorize, badJson, canManage, readJson } from "@/lib/authz";
import { cleanOpt } from "@/lib/domain/schemas";
import { dateOnly } from "@/lib/domain/dates";
import { logActivity } from "@/lib/activity";

type Ctx = { params: Promise<{ music_id: string }> };

export async function GET(request: NextRequest, props: Ctx) {
    const params = await props.params;
    const auth = await authorize(["ADMIN", "ARTIST_MANAGER", "USER"]);
    if (auth.error) return auth.error;

    const music = await prisma.music.findUnique({
        where: { id: params.music_id },
        include: { artist: { select: { name: true, createdBy: true } } }
    });

    // USER may only read music of artists they own
    if (!music || (!canManage(auth.user.role) && music.artist?.createdBy !== auth.user.id)) {
        return NextResponse.json({ error: "Music not found!" }, { status: 404 });
    }

    const { artist, ...rest } = music;
    return NextResponse.json(
        { music: { ...rest, artist: artist ? { name: artist.name } : null } },
        { status: 200 }
    );
}

// Update an existing music record (previously this handler wrongly created a new one)
export async function PUT(request: NextRequest, props: Ctx) {
    const params = await props.params;
    const auth = await authorize(["ADMIN", "ARTIST_MANAGER"]);
    if (auth.error) return auth.error;

    const reqData = await readJson(request);
    if (reqData === null) return badJson();

    const validation = MusicSchema.safeParse(reqData);
    if (!validation.success) {
        return NextResponse.json({ error: validation.error.issues }, { status: 400 });
    }
    const data = validation.data;

    const music = await prisma.music.findUnique({ where: { id: params.music_id } });
    if (!music) {
        return NextResponse.json({ error: "Music not found!" }, { status: 404 });
    }

    if (data.artistId) {
        const existingArtist = await prisma.artist.findUnique({ where: { id: data.artistId } });
        if (!existingArtist) {
            return NextResponse.json(
                { error: "Artist not found for the provided Artist ID" },
                { status: 400 }
            );
        }
    }

    const updatedMusic = await prisma.music.update({
        where: { id: music.id },
        data: {
            title: data.title,
            album: data.album,
            genre: data.genre,
            durationSec: cleanOpt(data.durationSec),
            releaseDate: dateOnly(data.releaseDate),
            coverUrl: cleanOpt(data.coverUrl),
            ...(data.artistId ? { artist: { connect: { id: data.artistId } } } : {})
        }
    });

    await logActivity(auth.user, "UPDATE", "SONG", updatedMusic.id, `Updated song ${updatedMusic.title}`);

    return NextResponse.json({ updatedData: updatedMusic }, { status: 200 });
}

export async function DELETE(request: NextRequest, props: Ctx) {
    const params = await props.params;
    const auth = await authorize(["ADMIN", "ARTIST_MANAGER"]);
    if (auth.error) return auth.error;

    const music = await prisma.music.findUnique({ where: { id: params.music_id } });
    if (!music) {
        return NextResponse.json({ error: "music not found" }, { status: 404 });
    }

    // favorites have no foreign key to songs, so remove them together with the song
    const [, deletedMusic] = await prisma.$transaction([
        prisma.favorite.deleteMany({ where: { targetType: "SONG", targetId: music.id } }),
        prisma.music.delete({ where: { id: music.id } }),
    ]);
    await logActivity(auth.user, "DELETE", "SONG", music.id, `Deleted song ${music.title}`);

    return NextResponse.json(
        { deletedMusic, msg: "Music deleted successfully!" },
        { status: 200 }
    );
}
