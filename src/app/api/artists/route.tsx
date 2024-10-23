import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../prisma/PrismaClient";
import { ArtistSchema } from "./ArtistSchema";
import bcrypt from "bcrypt";

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
    total_albums: string;  
    address: string;
    dob: string;
}

/**
 * Fetch All Artists
 */
export async function GET(request: NextRequest) {
    const allArtist = await prisma.user.findMany();

    return NextResponse.json(
        { users: allArtist, total_count: allArtist.length },
        { status: 200 }
    );
}

/**
 * Create a New Artist
 */
export async function POST(request: NextRequest) {
    const reqData: Artist = await request.json();

    console.log("reqData : ", reqData);

    // Validate the incoming data
    const validation = ArtistSchema.safeParse(reqData);

    if (!validation.success) {
        return NextResponse.json(
            { error: validation.error.errors },
            { status: 400 }
        );
    }

    // Check if the artist already exists by email
    const isArtistExist = await prisma.user.findUnique({
        where: {
            email: reqData.email
        }
    });

    if (isArtistExist) {
        return NextResponse.json(
            { error: "Email is already used!" },
            { status: 400 }
        );
    }

    // Convert total_albums to an integer before saving to the database
    const totalAlbumsAsInt = parseInt(reqData.total_albums, 10);

    // Hash the password before saving
    const hashPassword = bcrypt.hashSync(reqData.password, 10);

    // Create a new artist in the database
    const newArtist = await prisma.artist.create({
        data: {
            name: reqData.name,
            gender: reqData.gender,
            dob: reqData.dob,
            first_release_year: reqData.first_release_year,
            total_albums: totalAlbumsAsInt,  
            address: reqData.address,
            createdBy: "2"  
        }
    });

    if (newArtist) {
        return NextResponse.json(
            { newArtist },
            { status: 200 }
        );
    }

    return NextResponse.json(
        { error: "Error in creating artist" },
        { status: 400 }
    );
}
