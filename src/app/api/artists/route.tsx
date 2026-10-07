import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import prisma from "../../../../prisma/PrismaClient";
import { ArtistSchema } from "./ArtistSchema";
import { authorize, badJson, readJson, stripPassword } from "@/lib/authz";
import { ownArtistId, publicArtist } from "@/lib/artist-profile";
import { cleanOpt } from "@/lib/domain/schemas";
import { logActivity } from "@/lib/activity";

// ARTIST_MANAGER: all artists (full detail). ARTIST: all artists, public details only (own record in full).
// USER: no access.
export async function GET(){
    const auth = await authorize(["ARTIST", "ARTIST_MANAGER"]);
    if (auth.error) return auth.error;

    const rows = await prisma.artist.findMany();
    const mine = auth.user.role === "ARTIST" ? await ownArtistId(auth.user.id) : null;
    const allArtists = rows.map((r) => {
        const safe = stripPassword(r);
        if (auth.user.role === "ARTIST_MANAGER") return safe;
        // the UI treats "createdBy === me" as "my own artist", so an ARTIST sees their linked record that way
        return r.id === mine ? { ...safe, createdBy: auth.user.id } : publicArtist(safe);
    });

    return NextResponse.json(
        {  artists: allArtists, total_count: allArtists.length },
        {  status: 200 },
    );
}

export async function POST(request: NextRequest) {
    const auth = await authorize(["ARTIST_MANAGER"]);
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
            bio: cleanOpt(data.bio),
            photo: cleanOpt(data.photo),
            website: cleanOpt(data.website),
            instagram: cleanOpt(data.instagram),
            youtube: cleanOpt(data.youtube),
            spotify: cleanOpt(data.spotify),
            createdBy: auth.user.id, // taken from the session, not the request body
        }
    });

    await logActivity(auth.user, "CREATE", "ARTIST", newArtist.id, `Created artist ${newArtist.name}`);

    return NextResponse.json(
        { newArtist: stripPassword(newArtist) },
        { status: 200 }
    );
}
