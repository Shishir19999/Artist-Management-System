import { NextResponse } from "next/server";
import { authorize } from "@/lib/authz";

// Returns only the caller's own id/role (never the raw JWT).
export async function GET() {
    const auth = await authorize(["USER", "ARTIST_MANAGER", "ADMIN"]);
    if (auth.error) return auth.error;
    return NextResponse.json({ id: auth.user.id, role: auth.user.role });
}
