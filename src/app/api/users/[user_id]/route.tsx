import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../prisma/PrismaClient";
import { UserSchema } from "../UserSchema";

interface Props {
    params: {
        user_id: string;
    };
}

interface UserUpdatePayload {
    name: string;
    email: string;
    password: string;
}

/**
 * Fetch a single user by ID
 * @param request - Incoming request data
 * @param params - Request parameters containing user_id
 * @returns - User data or error response
 */
export async function GET(request: NextRequest, { params: { user_id } }: Props) {
    const user = await prisma.user.findUnique({
        where: {
            id: parseInt(user_id),
        },
    });

    if (!user) {
        return NextResponse.json(
            { error: "User not found!" },
            { status: 404 }
        );
    }

    return NextResponse.json({ data: user }, { status: 200 });
}

export async function PUT(request: NextRequest, { params: { user_id } }: Props) {
    const reqData: UserUpdatePayload = await request.json();

    // Run query to find user
    const user = await prisma.user.findUnique({
        where: {
            id: parseInt(user_id),
        },
    });

    // if not found return not found error
    if (!user) {
        return NextResponse.json({ error: "User Not Found!" }, { status: 404 });
    }

    // validate data
    const validation = UserSchema.safeParse(reqData);
    if (!validation.success) {
        return NextResponse.json(
            { error: validation.error.errors },
            { status: 400 }
        );
    }

    // check if email already exists (excluding current user)
    const isUserExist = await prisma.user.findFirst({
        where: {
            email: reqData.email,
            NOT: { id: parseInt(user_id) }, 
        },
    });

    if (isUserExist) {
        return NextResponse.json(
            { error: "Email is already used by another user!" },
            { status: 400 }
        );
    }

    // update user data
    const updatedUser = await prisma.user.update({
        where: {
            id: user.id,
        },
        data: {
            name: reqData.name,
            email: reqData.email,
            password: reqData.password,
        },
    });

    // return updated user data;
    return NextResponse.json({ updatedData: updatedUser }, { status: 200 });
}

export async function DELETE(request: NextRequest, { params: { user_id } }: Props) {
    // run find query by id
    const user = await prisma.user.findUnique({
        where: {
            id: parseInt(user_id),
        },
    });

    // check user
    if (!user) {
        return NextResponse.json(
            { error: "User not found" },
            { status: 404 }
        );
    }

    // delete user
    await prisma.user.delete({
        where: {
            id: parseInt(user_id),
        },
    });

    // return response
    return NextResponse.json(
        { msg: "User deleted successfully!" },
        { status: 200 }
    );
}
