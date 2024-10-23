import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../prisma/PrismaClient";
import { ArtistSchema } from "../ArtistSchema";
import bcrypt from 'bcrypt';

enum Gender {
    MALE = "MALE",
    FEMALE = "FEMALE",
    OTHER = "OTHER"
}

interface Artist {
    name: string;
    email: string;
    password: string;
    gender: Gender;
    first_release_year: string;
    total_albums: string;  // This will be a string from the request body
    address: string;
    dob: string;
}

/**
 * Fetch Single Artist with Music List
 */
export async function GET(request: NextRequest, { params }: { params: { user_id: string } }) {
    const { user_id } = await params; // Unwrap the params

    const artist = await prisma.artist.findUnique({
        where: {
            id: user_id 
        },
        include: {
            Music: {  
                select: {
                    title: true,
                    album: true,
                    Genre: true,
                    created_at: true,
                }
            }
        }
    });

    if (!artist) {
        return NextResponse.json(
            { error: "Artist not found!" },
            { status: 404 }
        );
    }

    return NextResponse.json(
        { artist, musicList: artist.Music },  // Return both artist and their music
        { status: 200 }
    );
}

/**
 * Update Artist Data
 */
export async function PUT(request: NextRequest, { params }: { params: { user_id: string } }) {
    const { user_id } = await params; // Unwrap the params
    const reqData: Artist = await request.json();

    // Find the artist by id
    const artist = await prisma.artist.findUnique({
        where: {
            id: user_id
        }
    });

    if (!artist) {
        return NextResponse.json(
            { error: "Artist Not Found!" },
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

    // Convert the total_albums field to a number before updating
    const totalAlbumsAsNumber = parseInt(reqData.total_albums);

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
            dob: reqData.dob,
            first_release_year: reqData.first_release_year,
            total_albums: totalAlbumsAsNumber,  // Converted to number
            address: reqData.address,
        }
    });

    return NextResponse.json(
        { updatedData: updatedArtist },
        { status: 200 }
    );
}

/**
 * Delete Artist Data
 */
export async function DELETE(request: NextRequest, { params }: { params: { user_id: string } }) {
    const { user_id } = await params; 

    // Find the artist by id
    const artist = await prisma.artist.findUnique({
        where: {
            id: user_id
        }
    });

    if (!artist) {
        return NextResponse.json(
            { error: "Artist not found" },
            { status: 404 }
        );
    }

    // Delete the artist
    const deletedArtist = await prisma.artist.delete({
        where: {
            id: user_id
        }
    });

    return NextResponse.json(
        { deletedArtist, msg: "Artist deleted successfully!" },
        { status: 200 }
    );
}
