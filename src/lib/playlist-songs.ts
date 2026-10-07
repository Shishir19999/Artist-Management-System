import prisma from "../../prisma/PrismaClient";
import { canManage, type AuthUser } from "./authz";

/**
 * De-duplicates the ids (keeping order) and checks every song exists and is visible to the user
 * (managers/admins: all songs, users: songs of artists they created). Returns null on any unknown id.
 */
export async function resolveSongIds(user: AuthUser, ids: string[]): Promise<string[] | null> {
    const unique = [...new Set(ids)];
    if (unique.length === 0) return [];
    const found = await prisma.music.findMany({
        where: { id: { in: unique }, ...(canManage(user.role) ? {} : { artist: { createdBy: user.id } }) },
        select: { id: true },
    });
    return found.length === unique.length ? unique : null;
}
