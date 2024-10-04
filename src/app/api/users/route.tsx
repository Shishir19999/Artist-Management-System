import { NextRequest,NextResponse } from 'next/server'
import UserSchema from "./UserSchema"
export function GET(request:NextRequest) {
  return NextResponse.json(
    {msg:"hello from user server"},
    {status:200}
  )
    
  
}

export async function POST(request:NextRequest){
 const reqData=await request.json();
 const validation=UserSchema.safeParse(reqData)
 if(!validation.success){
  return NextResponse.json(
    {error:validation.error.errors},
    {status:400}
  )
 }
  return NextResponse.json(
    {
      data:reqData,
      msg:"users Data",
      counter:3
    },
    {status:200}
  )
}