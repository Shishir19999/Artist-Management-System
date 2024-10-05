import { NextRequest, NextResponse } from "next/server";
import { MusicSchema} from "./MusicSchema";
import prisma from "./../../../../prisma/PrismaClient";

interface User{
    name: string,
    email: string,
    password: string,
}


export async function GET(request: NextRequest){

    const allUsers: User[] = await prisma.user.findMany();

    return NextResponse.json(
        {  datas: allUsers, total_data: allUsers.length },
        {  status: 200 },
    );
}

export async function POST(request: NextRequest){
    const reqData: User = await request.json();

    // validation
    const validation = MusicSchema.safeParse(reqData);
    if(!validation.success){
        return NextResponse.json(
            { error: validation.error.errors },
            { status: 400}
        )
    }

    // check existing email
    const isUserExist = await prisma.user.findUnique({
        where: {
            email: reqData.email
        }
    });

    if(isUserExist){
        return NextResponse.json(
            { error: "Email is already used!"},
            { status: 400}
        )
    }

    // create user
    const newUser = await prisma.user.create({
        data: {
            name: reqData.name,
            email: reqData.email,
            password: reqData.password
        }
    })

    // reponse inserted data
    return NextResponse.json(
        { data: newUser },
        { status: 200}
    );
}