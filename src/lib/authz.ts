import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { isRole, type AppRole } from "./roles";

export interface AuthUser {
    id: string;
    role: AppRole;
    email?: string | null;
    name?: string | null;
}

type AuthResult = { user: AuthUser; error?: undefined } | { user?: undefined; error: NextResponse };

/**
 * Authenticate the request and require one of `allowed` roles.
 * Revocation: the NextAuth jwt callback re-validates the token's tokenVersion against the DB on every
 * getServerSession call, so a logged-out / password-changed / role-changed token yields an empty user id here.
 * Usage:  const auth = await authorize(["ARTIST_MANAGER"]); if (auth.error) return auth.error;
 */
export async function authorize(allowed: readonly AppRole[]): Promise<AuthResult> {
    const session = await getServerSession(authOptions);
    const id = session?.user?.id;
    const role = session?.user?.role;

    if (!id || !isRole(role)) {
        return { error: NextResponse.json({ error: "Unauthenticated" }, { status: 401 }) };
    }
    if (!allowed.includes(role)) {
        return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
    }
    return { user: { id, role, email: session.user.email, name: session.user.name } };
}

export const canManage = (role: AppRole) => role === "ARTIST_MANAGER";

/** Parse a JSON body, returning null on malformed input. */
export async function readJson(request: Request): Promise<unknown | null> {
    try {
        return await request.json();
    } catch {
        return null;
    }
}

export const badJson = () => NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

/** Remove password hash from a record. */
export function stripPassword<T extends { password?: unknown; tokenVersion?: unknown }>(
    row: T
): Omit<T, "password" | "tokenVersion"> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, tokenVersion, ...safe } = row;
    return safe;
}
