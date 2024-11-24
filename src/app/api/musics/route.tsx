import { NextRequest, NextResponse } from "next/server";
import { MusicSchema} from "./MusicSchema";
import prisma from "./../../../../prisma/PrismaClient";

enum Genre{
    RNB = "RNB",
    COUNTRY = "COUNTRY",
    CLASSIC = "CLASSIC",
    ROCK="ROCK",
    JAZZ="JAZZ"
}

interface Music{
    title: string,
    album: string,
    genre: Genre,
    artistId:string
}

export async function GET(request: NextRequest) {
    try {
        const allMusics = await prisma.music.findMany();

        return NextResponse.json(
            { musics: allMusics, total_count: allMusics.length },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error fetching music:", error); // Log the error for debugging
        return NextResponse.json(
            { error: "Failed to fetch music data." },
            { status: 500 }
        );
    }
}


export async function POST(request: NextRequest){
    const reqData: Music = await request.json();

    // validation
    const validation = MusicSchema.safeParse(reqData);
    if(!validation.success){
        return NextResponse.json(
            { error: validation.error.errors },
            { status: 400}
        )
    }
    if (!reqData.artistId) {
        return NextResponse.json(
            { error: "Artist ID is required." },
            { status: 400 }
        );
    }

    const existingArtist = await prisma.artist.findUnique({
        where: { id: reqData.artistId },
    });
    if (!existingArtist) {
        return NextResponse.json(
            { error: "Artist not found for the provided Artist ID" },
            { status: 400 }
        );
    }
    
        

    const newMusic = await prisma.music.create({
        data: {
            title:reqData.title,
            album:reqData.album, 
            genre:reqData.genre,
            artist:{
                connect:{
                    id:reqData.artistId,
                }
            }
        }
    })

    // reponse inserted data
    return NextResponse.json(
        { data: newMusic },
        { status: 200}
    );
}