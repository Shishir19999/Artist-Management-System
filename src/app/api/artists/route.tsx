import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "../../../../prisma/PrismaClient";
import { ArtistSchema } from "./ArtistSchema";
import { authorize, badJson, canManage, readJson, stripPassword } from "@/lib/authz";

// ADMIN/ARTIST_MANAGER: all artists. USER: only artists they created.
export async function GET(){
    const auth = await authorize(["ADMIN", "ARTIST_MANAGER", "USER"]);
    if (auth.error) return auth.error;

    const rows = await prisma.artist.findMany({
        where: canManage(auth.user.role) ? undefined : { createdBy: auth.user.id }
    });
    const allArtists = rows.map(stripPassword);

    return NextResponse.json(
        {  artists: allArtists, total_count: allArtists.length },
        {  status: 200 },
    );
}

export async function POST(request: NextRequest) {
    const auth = await authorize(["ADMIN", "ARTIST_MANAGER"]);
    if (auth.error) return auth.error;

    const reqData = await readJson(request);
    if (reqData === null) return badJson();

    const validation = ArtistSchema.safeParse(reqData);
    if (!validation.success) {
        return NextResponse.json(
            { error: validation.error.issues },
            { status: 400 }
        );
    }
    const data = validation.data;

    if (data.email) {
        const taken = await prisma.artist.findUnique({ where: { email: data.email } });
        if (taken) {
            return NextResponse.json({ error: "Email is already in use." }, { status: 400 });
        }
    }

    const newArtist = await prisma.artist.create({
        data: {
            name: data.name,
            email: data.email,
            password: data.password ? await bcrypt.hash(data.password, 10) : undefined,
            gender: data.gender,
            first_release_year: data.first_release_year,
            total_albums: data.total_albums,
            address: data.address,
            createdBy: auth.user.id, // taken from the session, not the request body
        }
    });

    return NextResponse.json(
        { newArtist: stripPassword(newArtist) },
        { status: 200 }
    );
}
