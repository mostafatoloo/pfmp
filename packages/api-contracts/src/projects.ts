import { z } from "zod";
import { uuid } from "@pfmp/validation";

export const projectCreateSchema = z.object({
  name: z.string().min(1).max(300),
  description: z.string().max(20_000).optional(),
  billable: z.boolean().optional(),
  status: z.enum(["active", "archived"]).optional(),
});

export const projectUpdateSchema = z
  .object({
    name: z.string().min(1).max(300).optional(),
    description: z.string().max(20_000).nullable().optional(),
    billable: z.boolean().optional(),
    status: z.enum(["active", "archived"]).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "At least one field required" });

export const activityCreateSchema = z.object({
  name: z.string().min(1).max(300),
  notes: z.string().max(20_000).optional(),
});

export const activityUpdateSchema = z
  .object({
    name: z.string().min(1).max(300).optional(),
    notes: z.string().max(20_000).nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "At least one field required" });

export type ProjectCreate = z.infer<typeof projectCreateSchema>;
export type ProjectUpdate = z.infer<typeof projectUpdateSchema>;
export type ActivityCreate = z.infer<typeof activityCreateSchema>;
export type ActivityUpdate = z.infer<typeof activityUpdateSchema>;

export const projectIdParam = uuid;
