import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../prisma/PrismaClient";
import { UserSchema } from "../UserSchema";
import bcrypt from 'bcrypt';
import { Prisma } from "@prisma/client"; // Import Prisma types

interface Props {
    params: {
        user_id: string;
    };
}

// Update User Data
export async function PUT(request: NextRequest, { params: { user_id } }: Props) {
    const reqData: Prisma.UserUpdateInput = await request.json(); // Use Prisma's UserUpdateInput type

    // Run query to find user
    const user = await prisma.user.findUnique({
        where: {
            id: parseInt(user_id),
        },
    });

    // If user is not found, return an error
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

    // Hash password only if it is being updated
    let hashedPassword: string | undefined = undefined;
    if (reqData.password) {
        hashedPassword = bcrypt.hashSync(reqData.password as string, 10);
    }

    // Update user data
    const updatedUser = await prisma.user.update({
        where: {
            id: user.id,
        },
        data: {
            ...reqData,
            password: hashedPassword ? hashedPassword : user.password, // Ensure password is set to a string
        },
    });

    // Return updated user data
    return NextResponse.json(
        { updatedData: updatedUser },
        { status: 200 }
    );
}
