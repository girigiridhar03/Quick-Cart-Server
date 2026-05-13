import { z } from "zod";

export const createCategorySchema = z.object({
  name: z.string({ required_error: "Category name is required" }).trim().min(3),
  icon: z
    .string({ required_error: "Category Icon is required" })
    .trim()
    .emoji(),
  bgColor: z
    .string({ required_error: "Category Background color is required" })
    .trim()
    .regex(/^#([0-9A-F]{3}|[0-9A-F]{6})$/i, {
      message: "Invalid hex color code. Must be in format #RGB or #RRGGBB",
    }),
});

export const createSubCategorySchema = z.object({
  category: z
    .string({ required_error: "Category Id is required" })
    .trim()
    .min(24)
    .max(24),
  name: z
    .string({ required_error: "Sub Category name is required" })
    .trim()
    .min(3),
});
