import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../prisma/PrismaClient";
import { UserSchema } from "../UserSchema";

interface Props{
    params: {
        user_id: string
    }
}

interface User{
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
    const user = await prisma.user.findUnique({
        where: {
            id: parseInt(user_id)
        }
    })
    
    if(!user){
        return NextResponse.json(
            { error: "User not found!"},
            { status: 200}
        )
    }

    return NextResponse.json(
        {data: user },
        {status: 200}
    );
}

export async function PUT(request: NextRequest, { params: { user_id} }: Props ){
    const reqData: User = await request.json();

    // Run query to find user
    const user = await prisma.user.findUnique({
        where:{
            id: parseInt(user_id)
        }
    })
    
    // if not found return not found error
    if(!user){
        return NextResponse.json(
            { error:"User Not Found!"},
            { status: 404}
        )
    }
    
    // validation data
    const validation = UserSchema.safeParse(reqData);
    if(!validation.success){
        return NextResponse.json(
            { error: validation.error.errors},
            { status: 400}
        )
    }

    // check email already existing....
    // todo

    // update user data
    const updatedUser = await prisma.user.update({
        where: {
            id: user.id
        },
        data:{
            name: reqData.name,
            email: reqData.email,
            password: reqData.password
        }
    });
    
    // return updated user data;
    return NextResponse.json(
        { updatedData: updatedUser },
        { status: 200}
    );
}

export async function DELETE(request: NextRequest,{ params: { user_id} }: Props){
    // run find query by id
    const user = await prisma.user.findUnique({
        where: {
            id: parseInt(user_id)
        }
    })
    
    // check user
    if(!user){
        return NextResponse.json(
            { error: "User not found"},
            { status: 404}
        )
    }

    // delete user
    const deleteduser = await prisma.user.delete({
        where: {
            id: parseInt(user_id)
        }
    });

    
    // return response
    return NextResponse.json(
        {
            deleteduser,
            msg: "User delteed successfully!"},
        { status: 200}
    )
}