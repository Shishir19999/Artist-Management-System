import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../prisma/PrismaClient";
import { ArtistSchema } from "../ArtistSchema";
import bcrypt from 'bcrypt';
import { authorize, badJson, canManage, readJson, stripPassword } from "@/lib/authz";
import { cleanOpt } from "@/lib/domain/schemas";
import { logActivity } from "@/lib/activity";

type Ctx = { params: Promise<{ artist_id: string }> };

export async function GET(request: NextRequest, props: Ctx) {
    const params = await props.params;
    const auth = await authorize(["ADMIN", "ARTIST_MANAGER", "USER"]);
    if (auth.error) return auth.error;

    const artist = await prisma.artist.findUnique({
        where: { id: params.artist_id },
        include: {
            music: { select: { id: true, title: true, album: true, genre: true, durationSec: true, releaseDate: true, coverUrl: true, artistId: true } }
        }
    });

    // USER may only read artists they own; hide existence of others
    if (!artist || (!canManage(auth.user.role) && artist.createdBy !== auth.user.id)) {
        return NextResponse.json({ error: "artist not found!" }, { status: 404 });
    }

    return NextResponse.json({ artist: stripPassword(artist) }, { status: 200 });
}

export async function PUT(request: NextRequest, props: Ctx) {
    const params = await props.params;
    const auth = await authorize(["ADMIN", "ARTIST_MANAGER"]);
    if (auth.error) return auth.error;

    const reqData = await readJson(request);
    if (reqData === null) return badJson();

    const artist = await prisma.artist.findUnique({ where: { id: params.artist_id } });
    if (!artist) {
        return NextResponse.json({ error: "artist Not Found!" }, { status: 404 });
    }

    const validation = ArtistSchema.safeParse(reqData);
    if (!validation.success) {
        return NextResponse.json({ error: validation.error.issues }, { status: 400 });
    }
    const data = validation.data;

    if (data.email) {
        const existingArtist = await prisma.artist.findUnique({ where: { email: data.email } });
        if (existingArtist && existingArtist.id !== artist.id) {
            return NextResponse.json({ error: "Email is already in use." }, { status: 400 });
        }
    }

    const updatedArtist = await prisma.artist.update({
        where: { id: artist.id },
        data: {
            name: data.name,
            email: data.email,
            ...(data.password ? { password: await bcrypt.hash(data.password, 10) } : {}),
            gender: data.gender,
            first_release_year: data.first_release_year,
            total_albums: data.total_albums,
            address: data.address,
            bio: cleanOpt(data.bio),
            photo: cleanOpt(data.photo),
            website: cleanOpt(data.website),
            instagram: cleanOpt(data.instagram),
            youtube: cleanOpt(data.youtube),
            spotify: cleanOpt(data.spotify)
        }
    });

    await logActivity(auth.user, "UPDATE", "ARTIST", updatedArtist.id, `Updated artist ${updatedArtist.name}`);

    return NextResponse.json({ updatedData: stripPassword(updatedArtist) }, { status: 200 });
}

export async function DELETE(request: NextRequest, props: Ctx) {
    const params = await props.params;
    const auth = await authorize(["ADMIN", "ARTIST_MANAGER"]);
    if (auth.error) return auth.error;

    const artist = await prisma.artist.findUnique({ where: { id: params.artist_id } });
    if (!artist) {
        return NextResponse.json({ error: "artist not found" }, { status: 404 });
    }

    // favorites point at artists without a foreign key, so clean them up here (songs are kept, unlinked)
    const [, deletedArtist] = await prisma.$transaction([
        prisma.favorite.deleteMany({ where: { targetType: "ARTIST", targetId: artist.id } }),
        prisma.artist.delete({ where: { id: artist.id } }),
    ]);
    await logActivity(auth.user, "DELETE", "ARTIST", artist.id, `Deleted artist ${artist.name}`);

    return NextResponse.json(
        { deletedArtist: stripPassword(deletedArtist), msg: "artist deleted successfully!" },
        { status: 200 }
    );
}
