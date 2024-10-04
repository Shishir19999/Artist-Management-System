import { NextRequest, NextResponse } from "next/server";

interface Props{
    params:{
        artist_id:number
    }
}

export async function GET(request:NextRequest,{params:{artist_id}}:Props) {
    if(artist_id>10){
        
            return NextResponse.json(
                {error: "artist ID is too high"},
                {status: 404}
        )
    }
    return NextResponse.json(
        {data:{}},
        {status:200}
    )
}
export async function PUT(request:NextRequest,{params:{artist_id}}:Props) {
    const reqData=await request.json()
    if(artist_id>10){
        return NextResponse.json(
            {error:"artist not found"},
        {status:404}
        )
    }
    return NextResponse.json(
        {updatedData:reqData},
        {status:200}
    )
}

export function DELETE (request:NextRequest,{params:{artist_id}}:Props){
    if(artist_id>10){
        return NextResponse.json(
            {error:"artist not found"},
            {status:404},
        )
    }
    return NextResponse.json(
        {message:"artist deleted"},
        {status:200})
}