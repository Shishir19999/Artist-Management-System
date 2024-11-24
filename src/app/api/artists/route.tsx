import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../prisma/PrismaClient";
import { ArtistSchema } from "./ArtistSchema";

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
export async function GET(request: NextRequest){

    const allArtists = await prisma.artist.findMany();

    return NextResponse.json(
        {  artists: allArtists, total_count: allArtists.length },
        {  status: 200 },
    );
}
export async function POST(request: NextRequest) {
    const reqData: Artist = await request.json();

    console.log("reqData : ", reqData);

    const validation = ArtistSchema.safeParse(reqData);

    if (!validation.success) {
        return NextResponse.json(
            { error: validation.error.errors },
            { status: 400 }
        );
    }

    // Check if the user with createdBy ID exists
    const existingUser = await prisma.user.findUnique({
        where: { id: reqData.createdBy }, // Assuming reqData.created_by is passed in the request
    });

    if (!existingUser) {
        return NextResponse.json(
            { error: "User not found for the provided createdBy ID" },
            { status: 400 }
        );
    }
    const newArtist = await prisma.artist.create({
        data: {
            name: reqData.name,
            email: reqData.email,
            password: reqData.password,
            gender: reqData.gender,
            first_release_year: reqData.first_release_year,
            total_albums: reqData.total_albums,
            address: reqData.address,
            createdBy: reqData.createdBy, 
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
