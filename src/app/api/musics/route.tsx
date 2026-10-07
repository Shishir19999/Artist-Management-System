import { NextRequest, NextResponse } from "next/server";
import { MusicSchema} from "./MusicSchema";
import prisma from "./../../../../prisma/PrismaClient";
import { authorize, badJson, canManage, readJson } from "@/lib/authz";
import { cleanOpt } from "@/lib/domain/schemas";
import { dateOnly } from "@/lib/domain/dates";
import { logActivity } from "@/lib/activity";

// ADMIN/ARTIST_MANAGER: all music. USER: only music of artists they created.
export async function GET() {
    const auth = await authorize(["ADMIN", "ARTIST_MANAGER", "USER"]);
    if (auth.error) return auth.error;

    try {
        const allMusics = await prisma.music.findMany({
            where: canManage(auth.user.role) ? undefined : { artist: { createdBy: auth.user.id } }
        });

        return NextResponse.json(
            { musics: allMusics, total_count: allMusics.length },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error fetching music:", error);
        return NextResponse.json(
            { error: "Failed to fetch music data." },
            { status: 500 }
        );
    }
}


export async function POST(request: NextRequest){
    const auth = await authorize(["ADMIN", "ARTIST_MANAGER"]);
    if (auth.error) return auth.error;

    const reqData = await readJson(request);
    if (reqData === null) return badJson();

    const validation = MusicSchema.safeParse(reqData);
    if(!validation.success){
        return NextResponse.json(
            { error: validation.error.issues },
            { status: 400}
        )
    }
    const data = validation.data;
    if (!data.artistId) {
        return NextResponse.json(
            { error: "Artist ID is required." },
            { status: 400 }
        );
    }

    const existingArtist = await prisma.artist.findUnique({
        where: { id: data.artistId },
    });
    if (!existingArtist) {
        return NextResponse.json(
            { error: "Artist not found for the provided Artist ID" },
            { status: 400 }
        );
    }

    const newMusic = await prisma.music.create({
        data: {
            title: data.title,
            album: data.album,
            genre: data.genre,
            durationSec: cleanOpt(data.durationSec),
            releaseDate: dateOnly(data.releaseDate),
            coverUrl: cleanOpt(data.coverUrl),
            artist: { connect: { id: data.artistId } }
        }
    })

    await logActivity(auth.user, "CREATE", "SONG", newMusic.id, `Created song ${newMusic.title}`);

    return NextResponse.json(
        { data: newMusic },
        { status: 200}
    );
}
