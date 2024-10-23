import z from "zod";

export const ArtistSchema = z.object({
    name: z.string(),
    email: z.string({ required_error: "Email is requied!"}).email("Invalid Email Type!"),
    password: z.string({ required_error: "Password is requied!"}).min(3, "Minimum 3 characters is requird"),
    gender: z.enum(['MALE','FEMALE','OTHER']),
    dob: z.string({ required_error: "string is must required!"}),
    first_release_year: z.string({ required_error: "Date is must required!"}),
    total_albums: z.string(),
    address: z.string()
});