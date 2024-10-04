import { NextRequest,NextResponse } from 'next/server'

export function GET(request:NextRequest) {
  return NextResponse.json(
    {msg:"hello from music server"},
    {status:200}
  )
    
  
}

export async function POST(request:NextRequest){
 const data=await request.json();
  return NextResponse.json(
    {
      data:data,
      msg:"musics Data",
      counter:3
    },
    {status:200}
  )
}