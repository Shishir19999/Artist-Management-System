import z from 'zod'

const UserSchema=z.object({
    name:z.string({required_error:"Name is Required"}).min(3,"Minimum 3 character is required"),
    email:z.string({required_error:"Name is Required"}).email("Invalid Email Type!"),
    password:z.string({required_error:"Name is Required"}).min(3,"Minimum 3 character is required")
})
export default UserSchema;