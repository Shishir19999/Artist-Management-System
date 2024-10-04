import { NextRequest, NextResponse } from 'next/server'
import UserSchema from "./UserSchema"
import prisma from '../../../../prisma/PrismaClient';

interface User {
  name: string,
  email: string,
  password: string
}

export async function GET(request: NextRequest) {
  const allUsers:User[] =await prisma.user.findMany()
  return NextResponse.json(
    { datas: allUsers, total_data: allUsers.length },
    { status: 200 }
  )


}

export async function POST(request: NextRequest) {
  const reqData: User = await request.json();
  const validation = UserSchema.safeParse(reqData)
  if (!validation.success) {
    return NextResponse.json(
      { error: validation.error.errors },
      { status: 400 }
    )
  }
  const isUserExist = await prisma.user.findUnique({
    where: {
      email: reqData.email
    }
  })
  if (isUserExist) {
    return NextResponse.json(
      { error: "user already exist" },
      { status: 400 }
    )
  }
  const newUser = await prisma.user.create({
    data: {
      name: reqData.name,
      email: reqData.email,
      password: reqData.password
    }
  })

  return NextResponse.json(
    { data: newUser },
    { status: 200 }
  )
}