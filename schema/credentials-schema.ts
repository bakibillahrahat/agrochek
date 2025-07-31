import { z } from "zod";

export const emailSchema = z
  .string({ message: "Email is required" })
  .email({ message: "Invalid email" });

export const passwordSchema = z
  .string({ message: "Password is required" })
  .min(6, { message: "Password must be at least 6 characters" })
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: "Password must contain at least one uppercase letter, one lowercase letter, and one number"
  });