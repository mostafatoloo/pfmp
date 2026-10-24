import { z } from "zod";
import { dateOnly, isoUtc, uuid } from "@pfmp/validation";

export const termCreateSchema = z.object({
  name: z.string().min(1).max(200),
  startsOn: dateOnly,
  endsOn: dateOnly,
});

export const termUpdateSchema = termCreateSchema.partial().refine((v) => Object.keys(v).length > 0, {
  message: "At least one field required",
});

export const courseCreateSchema = z.object({
  termId: uuid,
  code: z.string().max(64).optional(),
  title: z.string().min(1).max(300),
});

export const courseUpdateSchema = z
  .object({
    code: z.string().max(64).nullable().optional(),
    title: z.string().min(1).max(300).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "At least one field required" });

export const topicCreateSchema = z.object({
  courseId: uuid,
  title: z.string().min(1).max(300),
  sortOrder: z.number().int().optional(),
});

export const topicUpdateSchema = z
  .object({
    title: z.string().min(1).max(300).optional(),
    sortOrder: z.number().int().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "At least one field required" });

export const assessmentCreateSchema = z.object({
  courseId: uuid,
  title: z.string().min(1).max(300),
  dueAtUtc: isoUtc.nullable().optional(),
  weightPercent: z.number().min(0).max(100).nullable().optional(),
});

export const assessmentUpdateSchema = z
  .object({
    title: z.string().min(1).max(300).optional(),
    dueAtUtc: isoUtc.nullable().optional(),
    weightPercent: z.number().min(0).max(100).nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "At least one field required" });

export const topicProgressUpdateSchema = z.object({
  measureType: z.enum(["percent", "checklist", "score"]),
  plannedValue: z.number().nullable().optional(),
  actualValue: z.number().nullable().optional(),
});
