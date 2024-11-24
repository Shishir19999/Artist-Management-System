import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../prisma/PrismaClient";
import { MusicSchema } from "../MusicSchema";

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

export async function GET(request: NextRequest, { params }: { params: { music_id: string } }) {
    const { music_id } = await params; 

    const music = await prisma.music.findUnique({
        where: {
            id: music_id
        },
        include: {
            artist: {
                select: {
                   name:true
                }
            }
        }
    });
    if (!music) {
        return NextResponse.json(
            { error: "Music not found!" },
            { status: 404 }
        );
    }

    return NextResponse.json(
        { music },
        { status: 200 }
    );
}
export async function PUT(request: NextRequest) {
    const reqData: Music = await request.json();

    console.log("reqData : ", reqData);

    const validation = MusicSchema.safeParse(reqData);

    if (!validation.success) {
        return NextResponse.json(
            { error: validation.error.errors },
            { status: 400 }
        );
    }

    // Check if the user with createdBy ID exists
    const existingArtist = await prisma.artist.findUnique({
        where: { id: reqData.artistId }, // Assuming reqData.created_by is passed in the request
    });

    if (!existingArtist) {
        return NextResponse.json(
            { error: "Music not found for the provided Artist ID" },
            { status: 400 }
        );
    }
    const newMusic = await prisma.music.create({
        data: {
                title:reqData.title,
                album:reqData.album, 
                genre:reqData.genre,
                artist:{
                    connect:{id:reqData.artistId}
                }
            } 
        
    });

    if (newMusic) {
        return NextResponse.json(
            { newMusic},
            { status: 200 }
        );
    }

    return NextResponse.json(
        { error: "Error in creating Music" },
        { status: 400 }
    );
}

export async function DELETE(request: NextRequest, { params }: { params: { music_id: string }}) {
    const {music_id } = await params; 

    // Find the artist by id
    const music = await prisma.music.findUnique({
        where: {
            id: music_id
        }
    });

    if (!music) {
        return NextResponse.json(
            { error: "music not found" },
            { status: 404 }
        );
    }

    // Delete the artist
    const deletedMusic = await prisma.music.delete({
        where: {
            id: music_id
        }
    });

    return NextResponse.json(
        { deletedMusic, msg: "Music deleted successfully!" },
        { status: 200 }
    );
}
