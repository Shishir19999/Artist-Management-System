import { NextRequest, NextResponse } from "next/server";
import { ArtistSchema} from "./ArtistSchema";
import prisma from "./../../../../prisma/PrismaClient";

interface ArtistUser{
    name: string,
    email: string,
    password: string,
}


export async function GET(request: NextRequest){

    const allArtistUsers: ArtistUser[] = await prisma.user.findMany();

    return NextResponse.json(
        {  datas: allArtistUsers, total_data: allArtistUsers.length },
        {  status: 200 },
    );
}

export async function POST(request: NextRequest){
    const reqData: ArtistUser = await request.json();

    // validation
    const validation = ArtistSchema.safeParse(reqData);
    if(!validation.success){
        return NextResponse.json(
            { error: validation.error.errors },
            { status: 400}
        )
    }

    // check existing email
    const isArtistUserExist = await prisma.user.findUnique({
        where: {
            email: reqData.email
        }
    });

    if(isArtistUserExist){
        return NextResponse.json(
            { error: "Email is already used!"},
            { status: 400}
        )
    }

    // create user
    const newArtistUser = await prisma.user.create({
        data: {
            name: reqData.name,
            email: reqData.email,
            password: reqData.password
        }
    })

    // reponse inserted data
    return NextResponse.json(
        { data: newArtistUser },
        { status: 200}
    );
}