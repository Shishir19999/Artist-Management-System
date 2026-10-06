import type { Account, Profile, Session, User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import prisma from "../../prisma/PrismaClient";
import { isRole } from "./roles";

/**
 * NextAuth callbacks, kept in their own module so they can be unit tested.
 * Revocation model: every User has `tokenVersion`. The version is copied into the JWT at
 * sign-in; a JWT whose version no longer matches the DB is dead (logout, password change
 * and role change all bump the version).
 */

export async function signInCallback({
    account,
    profile,
}: {
    user?: User;
    account?: Account | null;
    profile?: Profile;
}): Promise<boolean> {
    if (account?.provider === "google") {
        const p = profile as (Profile & { email_verified?: boolean }) | undefined;
        // only trust Google identities whose e-mail Google itself has verified
        return Boolean(p?.email && p.email_verified === true);
    }
    return true;
}

export async function jwtCallback({ token, user }: { token: JWT; user?: User }): Promise<JWT> {
    if (user) {
        // sign-in: the role always comes from the database, never from the provider profile
        const db = await prisma.user.findUnique({
            where: { id: user.id },
            select: { id: true, role: true, tokenVersion: true },
        });
        if (!db) return {};
        token.id = db.id;
        token.role = isRole(db.role) ? db.role : "USER";
        token.tv = db.tokenVersion;
        return token;
    }

    if (!token.id) return token;

    // later requests: re-validate against the DB so revocation and role changes apply immediately
    const db = await prisma.user.findUnique({
        where: { id: token.id },
        select: { role: true, tokenVersion: true },
    });
    if (!db || db.tokenVersion !== token.tv) return {}; // revoked / deleted
    token.role = isRole(db.role) ? db.role : "USER";
    return token;
}

export async function sessionCallback({ session, token }: { session: Session; token: JWT }): Promise<Session> {
    if (session.user) {
        // empty id (revoked token) is treated as unauthenticated by authorize()
        session.user.id = token.id ?? "";
        session.user.role = isRole(token.role) ? token.role : "USER";
    }
    return session;
}

/** Logout: bump the version so this (and any copied) JWT stops working server-side. */
export async function signOutEvent({ token }: { token: JWT }): Promise<void> {
    if (!token?.id || typeof token.tv !== "number") return;
    // conditional so replaying an already-revoked token cannot log the user out again
    await prisma.user.updateMany({
        where: { id: token.id, tokenVersion: token.tv },
        data: { tokenVersion: { increment: 1 } },
    });
}
