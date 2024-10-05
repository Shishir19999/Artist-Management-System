import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../prisma/PrismaClient";
import { ArtistSchema } from "../ArtistSchema";

interface Props{
    params: {
        user_id: string
    }
}

interface ArtistUser{
    name: string,
    email: string,
    password: string,
}

/**
 * 
 * @param request data
 * @param param fdsfdsf
 * @returns Updated user data
 * Fetch Single User
 */
export async function GET(request: NextRequest, { params: { user_id } }: Props){
    const artistUser = await prisma.user.findUnique({
        where: {
            id: parseInt(user_id)
        }
    })
    
    if(!artistUser){
        return NextResponse.json(
            { error: "User not found!"},
            { status: 200}
        )
    }

    return NextResponse.json(
        {data: artistUser },
        {status: 200}
    );
}

export async function PUT(request: NextRequest, { params: { user_id} }: Props ){
    const reqData: ArtistUser = await request.json();

    // Run query to find user
    const artistUser = await prisma.user.findUnique({
        where:{
            id: parseInt(user_id)
        }
    })
    
    // if not found return not found error
    if(!artistUser){
        return NextResponse.json(
            { error:"User Not Found!"},
            { status: 404}
        )
    }
    
    // validation data
    const validation = ArtistSchema.safeParse(reqData);
    if(!validation.success){
        return NextResponse.json(
            { error: validation.error.errors},
            { status: 400}
        )
    }

    // check email already existing....
    // todo

    // update user data
    const updatedArtistUser = await prisma.user.update({
        where: {
            id: artistUser.id
        },
        data:{
            name: reqData.name,
            email: reqData.email,
            password: reqData.password
        }
    });
    
    // return updated user data;
    return NextResponse.json(
        { updatedArtistData: updatedArtistUser },
        { status: 200}
    );
}

export async function DELETE(request: NextRequest,{ params: { user_id} }: Props){
    // run find query by id
    const artistUser = await prisma.user.findUnique({
        where: {
            id: parseInt(user_id)
        }
    })
    
    // check user
    if(!artistUser){
        return NextResponse.json(
            { error: "User not found"},
            { status: 404}
        )
    }

    // delete user
    const deletedArtistUser = await prisma.user.delete({
        where: {
            id: parseInt(user_id)
        }
    });

    
    // return response
    return NextResponse.json(
        {
            deletedArtistUser,
            msg: "User delteed successfully!"},
        { status: 200}
    )
}