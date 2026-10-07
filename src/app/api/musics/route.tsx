import { NextRequest, NextResponse } from "next/server";
import { MusicSchema} from "./MusicSchema";
import prisma from "./../../../../prisma/PrismaClient";
import { authorize, badJson, readJson } from "@/lib/authz";
import { ownArtistId, withArtistName } from "@/lib/artist-profile";
import { cleanOpt } from "@/lib/domain/schemas";
import { dateOnly } from "@/lib/domain/dates";
import { logActivity } from "@/lib/activity";

// Every role reads the whole catalogue (each item carries its artist name).
export async function GET() {
    const auth = await authorize(["USER", "ARTIST", "ARTIST_MANAGER"]);
    if (auth.error) return auth.error;

    try {
        const allMusics = await prisma.music.findMany({
            include: { artist: { select: { name: true } } },
        });

        return NextResponse.json(
            { musics: allMusics.map(withArtistName), total_count: allMusics.length },
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
    const auth = await authorize(["ARTIST", "ARTIST_MANAGER"]);
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
    // an ARTIST can only add songs to their own artist record (default) and never to someone else's
    if (auth.user.role === "ARTIST") {
        const mine = await ownArtistId(auth.user.id);
        if (!mine) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        if (data.artistId && data.artistId !== mine) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        data.artistId = mine;
    }
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
        },
        include: { artist: { select: { name: true } } },
    })

    await logActivity(auth.user, "CREATE", "SONG", newMusic.id, `Created song ${newMusic.title}`);

    return NextResponse.json(
        { data: withArtistName(newMusic) },
        { status: 200}
    );
}
