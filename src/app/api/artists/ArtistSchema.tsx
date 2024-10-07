import z from "zod";

export const ArtistSchema = z.object({
    name: z.string({ required_error: "Name is requied!"}).min(3, "Minimum 3 characters is requird"),
    email: z.string({ required_error: "Email is requied!"}).email("Invalid Email Type!"),
    password: z.string({ required_error: "Password is requied!"}).min(3, "Minimum 6 characters is requird"),
    phone: z.string().optional(),
    address: z.string().optional(),
    totalAlbums: z.number().min(0, "Total albums must be a non-negative number!"),
    firstReleaseYear: z.date({ required_error: "First Release Year is required!" }),


})