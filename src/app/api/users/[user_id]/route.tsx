import { NextRequest, NextResponse } from "next/server";

interface Props{
    params:{
        user_id:number
    }
}

export async function GET(request:NextRequest,{params:{user_id}}:Props) {
    if(user_id>10){
        
            return NextResponse.json(
                {error: "User ID is too high"},
                {status: 404}
        )
    }
    return NextResponse.json(
        {data:{}},
        {status:200}
    )
}
export async function PUT(request:NextRequest,{params:{user_id}}:Props) {
    const reqData=await request.json()
    if(user_id>10){
        return NextResponse.json(
            {error:"user not found"},
        {status:404}
        )
    }
    return NextResponse.json(
        {updatedData:reqData},
        {status:200}
    )
}

export function DELETE (request:NextRequest,{params:{user_id}}:Props){
    if(user_id>10){
        return NextResponse.json(
            {error:"user not found"},
            {status:404},
        )
    }
    return NextResponse.json(
        {message:"user deleted"},
        {status:200})
}