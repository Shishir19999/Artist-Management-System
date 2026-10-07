import prisma from "../../prisma/PrismaClient";

/** The artist record linked to a user with role ARTIST (null when the user has none). */
export async function ownArtistId(userId: string): Promise<string | null> {
    const artist = await prisma.artist.findUnique({ where: { userId }, select: { id: true } });
    return artist?.id ?? null;
}

/** Make sure a user with role ARTIST has a linked (initially empty) artist record. */
export async function ensureArtistProfile(user: { id: string; name?: string | null; gender?: "MALE" | "FEMALE" | "OTHER" | null; address?: string | null }): Promise<string> {
    const existing = await ownArtistId(user.id);
    if (existing) return existing;
    const created = await prisma.artist.create({
        data: {
            name: user.name?.trim() || "New artist",
            gender: user.gender ?? "MALE",
            address: user.address ?? null,
            userId: user.id,
            createdBy: user.id,
        },
        select: { id: true },
    });
    return created.id;
}

/** Fields an ARTIST sees about other people's artist records (no contact data, no owner ids). */
export function publicArtist<T extends Record<string, unknown>>(artist: T): Omit<T, "email" | "createdBy" | "userId"> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { email, createdBy, userId, ...rest } = artist;
    return rest;
}

/** Songs always carry `artistName` (string or null) next to the nested `artist`, for every role. */
export function withArtistName<T extends { artist?: { name: string } | null }>(song: T): T & { artistName: string | null } {
    return { ...song, artistName: song.artist?.name ?? null };
}
