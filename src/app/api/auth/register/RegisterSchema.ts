import z from "zod";
import { GENDERS } from "@/lib/domain/constants";

// zod 4 replaced `required_error`: only a missing (undefined) value gets the custom message
const required = (message: string) => (iss: { input?: unknown }) => (iss.input === undefined ? message : undefined);
const emptyToUndef = (v: unknown) => (v === "" || v === null ? undefined : v);

// Public sign-up: only USER or ARTIST may be requested (default USER).
// ARTIST_MANAGER can never be self-registered; any other value is rejected.
export const RegisterSchema = z.object({
    name: z.string({ error: required("Name is required") }).trim().min(2, "Name must be at least 2 characters").max(100),
    email: z
        .string({ error: required("Email is required") })
        .trim()
        .toLowerCase()
        .email("Invalid email")
        .max(190),
    // 72 bytes is bcrypt's input limit
    password: z
        .string({ error: required("Password is required") })
        .min(8, "Password must be at least 8 characters")
        .max(72, "Password must be at most 72 characters"),
    role: z.preprocess(emptyToUndef, z.enum(["USER", "ARTIST"], { error: "Role must be USER or ARTIST" }).default("USER")),
    phone: z.preprocess(emptyToUndef, z.string().trim().max(30).optional()),
    address: z.preprocess(emptyToUndef, z.string().trim().max(190).optional()),
    gender: z.preprocess(emptyToUndef, z.enum(GENDERS).optional()),
    birthDate: z.preprocess(
        emptyToUndef,
        z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, "Birth date must be YYYY-MM-DD")
            .refine((v) => !Number.isNaN(Date.parse(`${v}T00:00:00Z`)) && new Date(`${v}T00:00:00Z`) <= new Date(), "Birth date must be a valid past date")
            .optional()
    ),
});
