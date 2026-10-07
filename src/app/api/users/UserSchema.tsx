import z from "zod";

// zod 4 replaced `required_error`: only a missing (undefined) value gets the custom message
const required = (message: string) => (iss: { input?: unknown }) => (iss.input === undefined ? message : undefined);

export const UserSchema = z.object({
    name: z.string({ error: required("Name is requied!") }).min(3, "Minimum 3 characters is requird"),
    email: z.string({ error: required("Email is requied!") }).email("Invalid Email Type!"),
    password: z.string({ error: required("Password is requied!") }).min(3, "Minimum 3 characters is requird"),
    role: z.enum(["USER", "ARTIST", "ARTIST_MANAGER"]).optional()
})

// On update the password is optional (omit to keep the current one)
export const UserUpdateSchema = UserSchema.partial({ password: true });
