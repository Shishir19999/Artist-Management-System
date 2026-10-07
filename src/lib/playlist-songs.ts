import prisma from "../../prisma/PrismaClient";
import type { AuthUser } from "./authz";

/**
 * De-duplicates the ids (keeping order) and checks every song exists and is visible to the user
 * (every role may use any song of the catalogue). Returns null on any unknown id.
 */
export async function resolveSongIds(_user: AuthUser, ids: string[]): Promise<string[] | null> {
    const unique = [...new Set(ids)];
    if (unique.length === 0) return [];
    const found = await prisma.music.findMany({
        where: { id: { in: unique } },
        select: { id: true },
    });
    return found.length === unique.length ? unique : null;
}
