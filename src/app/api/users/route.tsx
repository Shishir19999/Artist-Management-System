import { NextRequest, NextResponse } from "next/server";
import { UserSchema } from "./UserSchema";
import prisma from "./../../../../prisma/PrismaClient";
import bcrypt from 'bcrypt';
import { authorize, badJson, readJson, stripPassword } from "@/lib/authz";
import { logActivity } from "@/lib/activity";
import { ensureArtistProfile } from "@/lib/artist-profile";

// ARTIST_MANAGER only: list users
export async function GET(){
    const auth = await authorize(["ARTIST_MANAGER"]);
    if (auth.error) return auth.error;

    const rows = await prisma.user.findMany();
    const allUsers = rows.map(stripPassword);

    return NextResponse.json(
        {  users: allUsers, total_count: allUsers.length },
        {  status: 200 },
    );
}

// ARTIST_MANAGER only: create user (only ARTIST_MANAGER can assign a role)
export async function POST(request: NextRequest){
    const auth = await authorize(["ARTIST_MANAGER"]);
    if (auth.error) return auth.error;

    const reqData = await readJson(request);
    if (reqData === null) return badJson();

    const validation = UserSchema.safeParse(reqData);
    if(!validation.success){
        return NextResponse.json(
            { error: validation.error.issues },
            { status: 400}
        )
    }
    const data = validation.data;

    const isUserExist = await prisma.user.findUnique({
        where: { email: data.email }
    });

    if(isUserExist){
        return NextResponse.json(
            { error: "Email is already used!"},
            { status: 400}
        )
    }

    const newUser = await prisma.user.create({
        data: {
            name: data.name,
            email: data.email,
            password: await bcrypt.hash(data.password, 10),
            role: data.role ?? "USER"
        }
    })

    if (newUser.role === "ARTIST") await ensureArtistProfile(newUser);

    await logActivity(auth.user, "CREATE", "USER", newUser.id, `Created user ${newUser.name ?? newUser.email}`);

    return NextResponse.json(
        { data: stripPassword(newUser) },
        { status: 200}
    );
}
