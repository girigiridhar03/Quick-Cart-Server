import { z } from "zod";

export const addReviewSchema = z.object({
  rating: z.number({ required_error: "rating is required" }).min(1).max(5),
  title: z.string({ required_error: "title is required" }).trim().min(3),
  body: z.string({ required_error: "body is required" }).trim().min(3),
});
