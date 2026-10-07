import z from "zod";
import { artistExtraFields } from "@/lib/domain/schemas";

// zod 4 replaced `required_error`: only a missing (undefined) value gets the custom message
const required = (message: string) => (iss: { input?: unknown }) => (iss.input === undefined ? message : undefined);

// the forms send "" for empty optional inputs
const emptyToUndef = (v: unknown) => (v === "" ? undefined : v);

export const ArtistSchema = z.object({
    name: z.string(),
    gender: z.enum(['MALE','FEMALE','OTHER']),
    first_release_year: z.string({ error: required("Date is must required!") }),
    total_albums: z.number(),
    address: z.string(),
    email: z.preprocess(emptyToUndef, z.string().email().optional()),
    password: z.preprocess(emptyToUndef, z.string().min(3, "Minimum 3 characters is requird").optional()),
    ...artistExtraFields,
});
