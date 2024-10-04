import { NextRequest, NextResponse } from "next/server";

interface Props{
    params:{
        music_id:number
    }
}

export async function GET(request:NextRequest,{params:{music_id}}:Props) {
    if(music_id>10){
        
            return NextResponse.json(
                {error: "music ID is too high"},
                {status: 404}
        )
    }
    return NextResponse.json(
        {data:{}},
        {status:200}
    )
}
export async function PUT(request:NextRequest,{params:{music_id}}:Props) {
    const reqData=await request.json()
    if(music_id>10){
        return NextResponse.json(
            {error:"music not found"},
        {status:404}
        )
    }
    return NextResponse.json(
        {updatedData:reqData},
        {status:200}
    )
}

export function DELETE (request:NextRequest,{params:{music_id}}:Props){
    if(music_id>10){
        return NextResponse.json(
            {error:"music not found"},
            {status:404},
        )
    }
    return NextResponse.json(
        {message:"music deleted"},
        {status:200})
}