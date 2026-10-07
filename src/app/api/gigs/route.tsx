import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../prisma/PrismaClient";
import { authorize, badJson, readJson } from "@/lib/authz";
import { ownArtistId } from "@/lib/artist-profile";
import { GigSchema, cleanOpt } from "@/lib/domain/schemas";
import { toGigDTO } from "@/lib/domain/serialize";
import { logActivity } from "@/lib/activity";

// ARTIST_MANAGER: all gigs. ARTIST: read-only, only gigs of their own linked artist. USER: no access.
export async function GET(request: NextRequest) {
    const auth = await authorize(["ARTIST", "ARTIST_MANAGER"]);
    if (auth.error) return auth.error;

    let artistId = request.nextUrl.searchParams.get("artistId");
    if (auth.user.role === "ARTIST") {
        const mine = await ownArtistId(auth.user.id);
        if (!mine || (artistId && artistId !== mine)) return NextResponse.json({ gigs: [], total_count: 0 }, { status: 200 });
        artistId = mine;
    }
    const rows = await prisma.gig.findMany({
        where: {
            ...(artistId ? { artistId } : {}),
        },
        orderBy: { date: "asc" },
    });
    const gigs = rows.map(toGigDTO);
    return NextResponse.json({ gigs, total_count: gigs.length }, { status: 200 });
}

export async function POST(request: NextRequest) {
    const auth = await authorize(["ARTIST_MANAGER"]);
    if (auth.error) return auth.error;

    const body = await readJson(request);
    if (body === null) return badJson();

    const parsed = GigSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
    const data = parsed.data;

    const artist = await prisma.artist.findUnique({ where: { id: data.artistId } });
    if (!artist) return NextResponse.json({ error: "Artist not found for the provided Artist ID" }, { status: 400 });

    const gig = await prisma.gig.create({
        data: {
            artistId: data.artistId,
            title: data.title,
            venue: data.venue,
            city: cleanOpt(data.city),
            date: new Date(data.date),
            status: data.status,
            fee: cleanOpt(data.fee),
            notes: cleanOpt(data.notes),
            createdBy: auth.user.id,
        },
    });
    await logActivity(auth.user, "CREATE", "GIG", gig.id, `Created gig ${gig.title} for ${artist.name}`);

    return NextResponse.json({ gig: toGigDTO(gig) }, { status: 201 });
}
