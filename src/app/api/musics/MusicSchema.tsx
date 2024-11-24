import z from "zod"

export const MusicSchema =z.object({
    title:z.string(),
    album:z.string(),
    genre:z.enum(['RNB',"COUNTRY",'CLASSIC','ROCK','JAZZ']),

})