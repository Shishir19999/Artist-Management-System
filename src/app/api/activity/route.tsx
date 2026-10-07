import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../prisma/PrismaClient";
import { authorize } from "@/lib/authz";

// ADMIN: everyone's trail (optionally ?userId=). Everyone else: only their own entries.
export async function GET(request: NextRequest) {
    const auth = await authorize(["ADMIN", "ARTIST_MANAGER", "USER"]);
    if (auth.error) return auth.error;

    const params = request.nextUrl.searchParams;
    const rawLimit = Number.parseInt(params.get("limit") ?? "", 10);
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 200) : 50;

    const userId = params.get("userId");
    if (userId && auth.user.role !== "ADMIN" && userId !== auth.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const where = auth.user.role === "ADMIN" ? (userId ? { userId } : {}) : { userId: auth.user.id };

    const rows = await prisma.activityLog.findMany({ where, orderBy: { created_at: "desc" }, take: limit });
    return NextResponse.json(
        {
            activity: rows.map((r) => ({
                id: r.id,
                userId: r.userId ?? null,
                userName: r.userName ?? null,
                action: r.action,
                entity: r.entity,
                entityId: r.entityId ?? null,
                summary: r.summary,
                created_at: r.created_at.toISOString(),
            })),
        },
        { status: 200 }
    );
}
