import { z } from "zod";
import mongoose from "mongoose";

export const createReportSchema = z
  .object({
    targetType: z.enum(["Review", "Product"], {
      message: "Target type must be either Review or Product",
    }),

    targetedId: z
      .string()
      .trim()
      .refine((value) => mongoose.isValidObjectId(value), "Invalid targetedId"),

    reason: z.enum([
      "Inappropriate",
      "Spam",
      "Offensive",
      "Fake Review",
      "Offensive Language",
      "Wrong Information",
      "Counterfeit Product",
      "Dangerous Product",
      "Other",
    ]),

    description: z
      .string()
      .trim()
      .max(500, "Description cannot exceed 500 characters")
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.reason === "Other" &&
      (!data.description || !data.description.trim())
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["description"],
        message: "Description is required when reason is Other",
      });
    }
  });
