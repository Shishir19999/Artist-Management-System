import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../prisma/PrismaClient";
import { UserUpdateSchema } from "../UserSchema";
import bcrypt from 'bcrypt';
import { authorize, badJson, readJson, stripPassword } from "@/lib/authz";
import { logActivity } from "@/lib/activity";

type Ctx = { params: Promise<{ user_id: string }> };

/**
 * Fetch Single User - ADMIN, or any signed-in user reading their own record
 */
export async function GET(request: NextRequest, props: Ctx) {
    const params = await props.params;
    const auth = await authorize(["ADMIN", "ARTIST_MANAGER", "USER"]);
    if (auth.error) return auth.error;

    const { user_id } = params;
    if (auth.user.role !== "ADMIN" && auth.user.id !== user_id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
        where: { id: user_id },
        include: { artist: { select: { name: true } } }
    });

    if (!user) {
        return NextResponse.json({ error: "User not found!" }, { status: 404 });
    }

    return NextResponse.json({ user: stripPassword(user) }, { status: 200 });
}

/**
 * Update User Data - ADMIN only (so role assignment is ADMIN only)
 */
export async function PUT(request: NextRequest, props: Ctx) {
    const params = await props.params;
    const auth = await authorize(["ADMIN"]);
    if (auth.error) return auth.error;

    const { user_id } = params;
    const reqData = await readJson(request);
    if (reqData === null) return badJson();

    const user = await prisma.user.findUnique({ where: { id: user_id } });
    if (!user) {
        return NextResponse.json({ error: "User Not Found!" }, { status: 404 });
    }

    const validation = UserUpdateSchema.safeParse(reqData);
    if (!validation.success) {
        return NextResponse.json({ error: validation.error.issues }, { status: 400 });
    }
    const data = validation.data;

    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser && existingUser.id !== user.id) {
        return NextResponse.json({ error: "Email is already in use." }, { status: 400 });
    }

    // an admin must not demote themselves (avoids locking out the last admin)
    if (user.id === auth.user.id && data.role && data.role !== "ADMIN") {
        return NextResponse.json({ error: "You cannot change your own role." }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
            name: data.name,
            email: data.email,
            ...(data.password ? { password: await bcrypt.hash(data.password, 10) } : {}),
            ...(data.role ? { role: data.role } : {}),
            // password or role change revokes the user's existing sessions
            ...(data.password || (data.role && data.role !== user.role) ? { tokenVersion: { increment: 1 } } : {})
        }
    });

    await logActivity(auth.user, "UPDATE", "USER", updatedUser.id, `Updated user ${updatedUser.name ?? updatedUser.email}`);

    return NextResponse.json({ updatedData: stripPassword(updatedUser) }, { status: 200 });
}

/**
 * Delete User Data - ADMIN only
 */
export async function DELETE(request: NextRequest, props: Ctx) {
    const params = await props.params;
    const auth = await authorize(["ADMIN"]);
    if (auth.error) return auth.error;

    const { user_id } = params;
    if (user_id === auth.user.id) {
        return NextResponse.json({ error: "You cannot delete your own account." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: user_id } });
    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const deletedUser = await prisma.user.delete({ where: { id: user_id } });

    await logActivity(auth.user, "DELETE", "USER", user.id, `Deleted user ${user.name ?? user.email}`);

    return NextResponse.json(
        { deletedUser: stripPassword(deletedUser), msg: "User deleted successfully!" },
        { status: 200 }
    );
}
