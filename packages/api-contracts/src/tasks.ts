import { z } from "zod";
import { isoUtc, uuid } from "@pfmp/validation";

export const taskStatusSchema = z.enum([
  "inbox",
  "planned",
  "in_progress",
  "completed",
  "cancelled",
]);

export const taskCreateSchema = z.object({
  title: z.string().min(1).max(500),
  notes: z.string().max(20_000).optional(),
  status: taskStatusSchema.optional(),
  dueAtUtc: isoUtc.nullable().optional(),
  projectId: uuid.nullable().optional(),
  courseId: uuid.nullable().optional(),
  priority: z.number().int().nullable().optional(),
});

export const taskUpdateSchema = z
  .object({
    title: z.string().min(1).max(500).optional(),
    notes: z.string().max(20_000).nullable().optional(),
    status: taskStatusSchema.optional(),
    dueAtUtc: isoUtc.nullable().optional(),
    projectId: uuid.nullable().optional(),
    courseId: uuid.nullable().optional(),
    priority: z.number().int().nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "At least one field required" });

export const taskListQuerySchema = z.object({
  status: taskStatusSchema.optional(),
  dueBefore: isoUtc.optional(),
  dueAfter: isoUtc.optional(),
  q: z.string().max(200).optional(),
  preset: z.enum(["overdue", "upcoming"]).optional(),
});

export type TaskCreate = z.infer<typeof taskCreateSchema>;
export type TaskUpdate = z.infer<typeof taskUpdateSchema>;
export type TaskListQuery = z.infer<typeof taskListQuerySchema>;
