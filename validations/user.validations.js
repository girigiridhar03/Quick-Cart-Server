import { email, z } from "zod";

export const registerSchema = z.object({
  username: z
    .string({ required_error: "Username is required" })
    .min(3, "Username must be at least 3 characters."),
  email: z
    .string({ required_error: "Email is required" })
    .email("Invalid email format"),
  password: z
    .string({ required_error: "Password is required" })
    .min(8, "Password must be at least 8 characters.")
    .regex(/[A-Z]/, "Password must contains at least one uppercase letter")
    .regex(/[0-9]/, "Password must contains at least one number"),
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email("Invalid email format"),
  password: z
    .string({ required_error: "Password is required" })
    .min(8, "Password must be at least 8 characters.")
    .regex(/[A-Z]/, "Password must contains at least one uppercase letter")
    .regex(/[0-9]/, "Password must contains at least one number"),
});
