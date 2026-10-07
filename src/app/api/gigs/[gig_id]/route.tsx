import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../prisma/PrismaClient";
import { authorize, badJson, canManage, readJson } from "@/lib/authz";
import { GigSchema, cleanOpt } from "@/lib/domain/schemas";
import { toGigDTO } from "@/lib/domain/serialize";
import { logActivity } from "@/lib/activity";

type Ctx = { params: Promise<{ gig_id: string }> };

export async function GET(request: NextRequest, props: Ctx) {
    const { gig_id } = await props.params;
    const auth = await authorize(["ADMIN", "ARTIST_MANAGER", "USER"]);
    if (auth.error) return auth.error;

    const gig = await prisma.gig.findUnique({ where: { id: gig_id }, include: { artist: { select: { createdBy: true } } } });
    // USER may only read gigs of artists they own; hide existence of others
    if (!gig || (!canManage(auth.user.role) && gig.artist?.createdBy !== auth.user.id)) {
        return NextResponse.json({ error: "Gig not found!" }, { status: 404 });
    }
    return NextResponse.json({ gig: toGigDTO(gig) }, { status: 200 });
}

export async function PUT(request: NextRequest, props: Ctx) {
    const { gig_id } = await props.params;
    const auth = await authorize(["ADMIN", "ARTIST_MANAGER"]);
    if (auth.error) return auth.error;

    const body = await readJson(request);
    if (body === null) return badJson();

    const gig = await prisma.gig.findUnique({ where: { id: gig_id } });
    if (!gig) return NextResponse.json({ error: "Gig not found!" }, { status: 404 });

    const parsed = GigSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
    const data = parsed.data;

    const artist = await prisma.artist.findUnique({ where: { id: data.artistId } });
    if (!artist) return NextResponse.json({ error: "Artist not found for the provided Artist ID" }, { status: 400 });

    const updated = await prisma.gig.update({
        where: { id: gig.id },
        data: {
            artistId: data.artistId,
            title: data.title,
            venue: data.venue,
            city: cleanOpt(data.city),
            date: new Date(data.date),
            status: data.status,
            fee: cleanOpt(data.fee),
            notes: cleanOpt(data.notes),
        },
    });
    await logActivity(auth.user, "UPDATE", "GIG", updated.id, `Updated gig ${updated.title}`);
    return NextResponse.json({ gig: toGigDTO(updated) }, { status: 200 });
}

export async function DELETE(request: NextRequest, props: Ctx) {
    const { gig_id } = await props.params;
    const auth = await authorize(["ADMIN", "ARTIST_MANAGER"]);
    if (auth.error) return auth.error;

    const gig = await prisma.gig.findUnique({ where: { id: gig_id } });
    if (!gig) return NextResponse.json({ error: "Gig not found!" }, { status: 404 });

    await prisma.gig.delete({ where: { id: gig.id } });
    await logActivity(auth.user, "DELETE", "GIG", gig.id, `Deleted gig ${gig.title}`);
    return NextResponse.json({ gig: toGigDTO(gig), msg: "Gig deleted successfully!" }, { status: 200 });
}
