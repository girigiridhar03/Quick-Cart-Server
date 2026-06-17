import { z } from "zod";

export const addReviewSchema = z.object({
  rating: z.preprocess(
    (val) => Number(val),
    z.number({ required_error: "rating is required" }).min(1).max(5),
  ),
  title: z.string({ required_error: "title is required" }).trim().min(3),
  body: z.string({ required_error: "body is required" }).trim().min(10),
});

export const editReviewSchema = z
  .object({
    title: z.string().trim().min(3).optional(),
    body: z.string().trim().min(10).optional(),
    rating: z.preprocess(
      (val) => Number(val),
      z.number({ required_error: "rating is required" }).min(1).max(5),
    ),
    isHidden: z.coerce.boolean().optional(),
    adminReply: z.string().trim().optional(),
  })
  .refine((data) => Object.values(data).some((val) => val !== undefined), {
    message: "At least one field must be provided",
  });
