import z from "zod";

export const UserSchema = z.object({
    fname: z.string({ required_error: "First Name is requied!"}).min(3, "Minimum 3 characters is requird"),
    lname: z.string({ required_error: "Last Name is requied!"}).min(3, "Minimum 3 characters is requird"),
    email: z.string({ required_error: "Email is requied!"}).email("Invalid Email Type!"),
    password: z.string({ required_error: "Password is requied!"}).min(3, "Minimum 6 characters is requird"),
    phone: z.string().optional(),
    address: z.string().optional(),
})