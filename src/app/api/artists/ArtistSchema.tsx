import z from "zod";

export const ArtistSchema = z.object({
    name: z.string(),
    gender: z.enum(['MALE','FEMALE','OTHER']),
    first_release_year: z.string({ required_error: "Date is must required!"}),
    total_albums: z.number(),
    address: z.string()
});