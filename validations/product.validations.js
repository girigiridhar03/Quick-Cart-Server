import { z } from "zod";
export const createProductSchema = z.object({
  name: z.string({ required_error: "Product name is required" }).trim().min(3),
  brand: z.string({ required_error: "Brand is required" }).trim().min(3),
  weight: z.string({ required_error: "Weight is required" }).trim(),
  mrp: z.preprocess(
    (val) => Number(val),
    z.number({ required_error: "MRP is required" }).min(1),
  ),
  category: z
    .string({ required_error: "Category Id is required" })
    .trim()
    .max(24),
  subCategory: z
    .string({ required_error: "SubCategory Id is required" })
    .trim()
    .length(24),
  discount: z.preprocess(
    (val) => Number(val),
    z.number({ required_error: "Discount is required" }),
  ),
  description: z
    .string({ required_error: "Description is required" })
    .trim()
    .min(3),
  tags: z
    .array(z.string({ required_error: "Each tag must be a string" }))
    .min(1, { message: "At least one tag is required" }),
  stock: z.preprocess(
    (val) => (val === undefined ? undefined : Number(val)),
    z.number().optional(),
  ),
});

export const updateProductSchema = z.object({
  name: z.string().trim().min(3).optional(),
  brand: z.string().trim().min(3).optional(),
  weight: z.string().trim().min(1).optional(),
  mrp: z.preprocess(
    (val) => (val === undefined ? undefined : Number(val)),
    z.number().min(1).optional(),
  ),
  category: z.string().trim().length(24).optional(),
  subCategory: z.string().trim().length(24).optional(),
  discount: z.preprocess(
    (val) => (val === undefined ? undefined : Number(val)),
    z.number().min(0).optional(),
  ),
  description: z.string().trim().min(3).optional(),

  tags: z.array(z.string().trim().min(1)).min(1).optional(),
  stock: z.preprocess(
    (val) => (val === undefined ? undefined : Number(val)),
    z.number().min(0).optional(),
  ),
  isActive: z.boolean().optional(),
}).refine(
  (data) => Object.values(data).some((val) => val !== undefined),
  { message: "At least one field must be provided" }
);
