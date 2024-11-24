import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../prisma/PrismaClient";
import { ArtistSchema } from "../ArtistSchema";
import bcrypt from 'bcrypt';

enum Gender{
    MALE="MALE",
    FEMALE="FEMALE",
    OTHER="OTHER"
}
interface Artist{
    name: string,
    email: string,
    password: string,
    gender:Gender,
    first_release_year:string,
    total_albums:number,
    address:string,
    createdBy:string
}

export async function GET(request: NextRequest, { params }: { params: { artist_id: string } }) {
    const { artist_id } = await params; // Unwrap the params

    const artist = await prisma.artist.findUnique({
        where: {
            id: artist_id
        },
        include: {
            music: {
                select: {
                    title: true,
                    album:true,
                    genre:true
                }
            }
        }
    });

    if (!artist) {
        return NextResponse.json(
            { error: "artist not found!" },
            { status: 404 }
        );
    }

    return NextResponse.json(
        { artist },
        { status: 200 }
    );
}

export async function PUT(request: NextRequest, { params }: { params: { artist_id: string } }) {
    const { artist_id } = await params; 
    const reqData: Artist = await request.json();

    // Find the artist by id
    const artist = await prisma.artist.findUnique({
        where: {
            id: artist_id
        }
    });

    if (!artist) {
        return NextResponse.json(
            { error: "artist Not Found!" },
            { status: 404 }
        );
    }

    // Validate data
    const validation = ArtistSchema.safeParse(reqData);
    if (!validation.success) {
        return NextResponse.json(
            { error: validation.error.errors },
            { status: 400 }
        );
    }

    // Check if the email already exists (ignoring the current artist)
    const existingArtist = await prisma.artist.findUnique({
        where: {
            email: reqData.email
        }
    });

    if (existingArtist && existingArtist.id !== artist.id) {
        return NextResponse.json(
            { error: "Email is already in use." },
            { status: 400 }
        );
    }

    // Hash the password asynchronously
    const hashedPassword = await bcrypt.hash(reqData.password, 10);
    
    // Update the artist data
    const updatedArtist = await prisma.artist.update({
        where: {
            id: artist.id
        },
        data: {
            name: reqData.name,
            email: reqData.email,
            password: hashedPassword,
            gender: reqData.gender,
            first_release_year: reqData.first_release_year,
            total_albums:reqData.total_albums,
            address: reqData.address
        }
    });

    return NextResponse.json(
        { updatedData: updatedArtist },
        { status: 200 }
    );
}

export async function DELETE(request: NextRequest, { params }: { params: { artist_id: string }}) {
    const { artist_id } = await params; 

    // Find the artist by id
    const artist = await prisma.artist.findUnique({
        where: {
            id: artist_id
        }
    });

    if (!artist) {
        return NextResponse.json(
            { error: "artist not found" },
            { status: 404 }
        );
    }

    // Delete the artist
    const deletedArtist = await prisma.artist.delete({
        where: {
            id: artist_id
        }
    });

    return NextResponse.json(
        { deletedArtist, msg: "artist deleted successfully!" },
        { status: 200 }
    );
}
