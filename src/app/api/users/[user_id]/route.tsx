import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../prisma/PrismaClient";
import { UserSchema } from "../UserSchema";
import bcrypt from 'bcrypt';

enum Role {
    ADMIN = "ADMIN",
    USER = "USER",
    ARTIST_MANAGER = "ARTIST_MANAGER"
}

interface User {
    name: string;
    email: string;
    password: string;
    role: Role;
}

/**
 * Fetch Single User
 */
export async function GET(request: NextRequest, { params }: { params: { user_id: string } }) {
    const { user_id } = await params; // Unwrap the params

    const user = await prisma.user.findUnique({
        where: {
            id: user_id
        },
        include: {
            artist: {
                select: {
                    name: true
                }
            }
        }
    });

    if (!user) {
        return NextResponse.json(
            { error: "User not found!" },
            { status: 404 }
        );
    }

    return NextResponse.json(
        { user },
        { status: 200 }
    );
}

/**
 * Update User Data
 */
export async function PUT(request: NextRequest, { params }: { params: { user_id: string } }) {
    const { user_id } = await params; // Unwrap the params
    const reqData: User = await request.json();

    // Find the user by id
    const user = await prisma.user.findUnique({
        where: {
            id: user_id
        }
    });

    if (!user) {
        return NextResponse.json(
            { error: "User Not Found!" },
            { status: 404 }
        );
    }

    // Validate data
    const validation = UserSchema.safeParse(reqData);
    if (!validation.success) {
        return NextResponse.json(
            { error: validation.error.errors },
            { status: 400 }
        );
    }

    // Check if the email already exists (ignoring the current user)
    const existingUser = await prisma.user.findUnique({
        where: {
            email: reqData.email
        }
    });

    if (existingUser && existingUser.id !== user.id) {
        return NextResponse.json(
            { error: "Email is already in use." },
            { status: 400 }
        );
    }

    // Hash the password asynchronously
    const hashedPassword = await bcrypt.hash(reqData.password, 10);

    // Update the user data
    const updatedUser = await prisma.user.update({
        where: {
            id: user.id
        },
        data: {
            name: reqData.name,
            email: reqData.email,
            password: hashedPassword,
            role: reqData.role
        }
    });

    return NextResponse.json(
        { updatedData: updatedUser },
        { status: 200 }
    );
}

/**
 * Delete User Data
 */
export async function DELETE(request: NextRequest, { params }: { params: { user_id: string }}) {
    const { user_id } = await params; 

    // Find the user by id
    const user = await prisma.user.findUnique({
        where: {
            id: user_id
        }
    });

    if (!user) {
        return NextResponse.json(
            { error: "User not found" },
            { status: 404 }
        );
    }

    // Delete the user
    const deletedUser = await prisma.user.delete({
        where: {
            id: user_id
        }
    });

    return NextResponse.json(
        { deletedUser, msg: "User deleted successfully!" },
        { status: 200 }
    );
}
