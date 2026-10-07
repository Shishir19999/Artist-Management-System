import z from "zod"
import { GENRES } from "@/lib/domain/constants";
import { musicExtraFields } from "@/lib/domain/schemas";

export const MusicSchema =z.object({
    title:z.string(),
    album:z.string(),
    genre:z.enum(GENRES),
    artistId:z.string().optional(),
    ...musicExtraFields,
})
