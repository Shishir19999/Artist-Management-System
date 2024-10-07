import { NextRequest, NextResponse } from "next/server";
import { ArtistSchema } from "./ArtistSchema";
import prisma from "./../../../../prisma/PrismaClient";

interface ArtistUser {
    name: string;
    email: string;
    password: string;
    firstReleaseYear: Date; 
    totalAlbums: number;
    address?: string; 
    dob: Date; 
}

export async function GET(request: NextRequest) {
    const allArtistUsers = await prisma.artist.findMany({
        include: {
            user: true, 
        },
    });

    return NextResponse.json(
        { datas: allArtistUsers, total_data: allArtistUsers.length },
        { status: 200 },
    );
}

export async function POST(request: NextRequest) {
    const reqData: ArtistUser = await request.json();

    // Validate incoming data
    const validation = ArtistSchema.safeParse(reqData);
    if (!validation.success) {
        return NextResponse.json(
            { error: validation.error.errors },
            { status: 400 }
        );
    }

    // Check existing email
    const isArtistUserExist = await prisma.user.findUnique({
        where: {
            email: reqData.email,
        },
    });

    if (isArtistUserExist) {
        return NextResponse.json(
            { error: "Email is already used!" },
            { status: 400 }
        );
    }

    // Create user details
    const newUser = await prisma.user.create({
        data: {
            name: reqData.name,
            email: reqData.email,
            password: reqData.password,
            dob: reqData.dob ||'',
        },
    });

    // Create artist details
    const newArtistUser = await prisma.artist.create({
        data: {
            user: {
                connect: {
                    id: newUser.id, // Linking the newly created user by ID
                },
            },
            dob: reqData.dob,
            first_release_year: reqData.firstReleaseYear,
            total_albums: reqData.totalAlbums,
            address: reqData.address || '',
            create_by: newUser.id, // Use the user's numeric ID here
        },
    });

    // Response with the inserted artist data
    return NextResponse.json(
        { data: newArtistUser },
        { status: 200 }
    );
}
