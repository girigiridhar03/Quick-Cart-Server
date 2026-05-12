import { z } from "zod";

export const addAddressSchema = z.object({
  street: z.string({ required_error: "Street is required" }).trim(),
  state: z.string({ required_error: "State is required" }).trim(),
  pincode: z
    .string({ required_error: "PIN code is required" })
    .trim()
    .length(6, { message: "PIN code must be exactly 6 digits" })
    .regex(/^[1-9][0-9]{5}$/, {
      message: "PIN code must be exactly 6 digits and cannot start with 0",
    }),
  city: z.string({ required_error: "City is required" }).trim(),
  label: z.string({ required_error: "Label is required" }).trim(),
  landmark: z.string({ required_error: "Landmark is required" }).trim(),
  isDefault: z.boolean().optional(),
});

export const updateAddressSchema = z.object({
  street: z.string().trim().min(3).optional(),
  state: z.string().trim().min(3).optional(),
  pincode: z
    .string()
    .trim()
    .length(6, {
      message: "PIN code must be exactly 6 digits",
    })
    .regex(/^[1-9][0-9]{5}$/, {
      message: "PIN code must be exactly 6 digits and cannot start with 0",
    })
    .optional(),
  city: z.string().trim().min(3).optional(),
  label: z.string().trim().min(3).optional(),
  landmark: z.string().trim().min(3).optional(),
  isDefault: z.boolean().optional(),
});
