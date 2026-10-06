import z from "zod";

// zod 4 replaced `required_error`: only a missing (undefined) value gets the custom message
const required = (message: string) => (iss: { input?: unknown }) => (iss.input === undefined ? message : undefined);

// Public sign-up: role is deliberately NOT part of the schema (unknown keys are stripped),
// so a client can never choose its own role.
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
});
