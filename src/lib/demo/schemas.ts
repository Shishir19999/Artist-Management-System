import z from "zod";
import { GENDERS } from "@/lib/domain/constants";

const required = (message: string) => (iss: { input?: unknown }) => (iss.input === undefined ? message : undefined);

/** Public sign-up in the preview: a visitor may be a User or an Artist, never an Artist Manager. */
export const DemoRegisterSchema = z.object({
    name: z.string({ error: required("Name is required") }).trim().min(2, "Name must be at least 2 characters").max(100),
    email: z.string({ error: required("Email is required") }).trim().toLowerCase().email("Invalid email").max(190),
    password: z
        .string({ error: required("Password is required") })
        .min(8, "Password must be at least 8 characters")
        .max(72, "Password must be at most 72 characters"),
    phone: z.string().trim().max(40).optional(),
    address: z.string().trim().max(190).optional(),
    gender: z.enum(GENDERS).default("MALE"),
    birthDate: z
        .string()
        .trim()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Birth date must be YYYY-MM-DD")
        .optional()
        .or(z.literal("")),
    role: z.enum(["USER", "ARTIST"]).default("USER"),
});

export const DemoUserSchema = z.object({
    name: z.string({ error: required("Name is required") }).trim().min(3, "Minimum 3 characters is required"),
    email: z.string({ error: required("Email is required") }).trim().email("Invalid email"),
    password: z.string({ error: required("Password is required") }).min(3, "Minimum 3 characters is required"),
    role: z.enum(["USER", "ARTIST", "ARTIST_MANAGER"]).optional(),
});

/** On update the password is optional (omit to keep the current one). */
export const DemoUserUpdateSchema = DemoUserSchema.partial({ password: true });
