import { z } from "zod";
import { durationSeconds, isoUtc } from "@pfmp/validation";

export const planningBlockSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(500),
  durationSeconds,
  earliestStartUtc: isoUtc,
  latestEndUtc: isoUtc,
});

export const scheduleDeterministicSchema = z.object({
  windowStartUtc: isoUtc,
  blocks: z.array(planningBlockSchema).min(1),
  persist: z.boolean().optional(),
  label: z.string().max(200).optional(),
});

export const scheduleVersionCreateSchema = z.object({
  label: z.string().max(200).optional(),
  source: z.enum(["manual", "deterministic", "ai_accepted"]).default("manual"),
  supersedePrevious: z.boolean().optional(),
  items: z.array(
    z.object({
      title: z.string().min(1).max(500),
      startsAtUtc: isoUtc,
      endsAtUtc: isoUtc,
      durationSeconds,
    }),
  ),
});

export const timerStartSchema = z.object({
  taskId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  note: z.string().max(2000).optional(),
});

export const timeEntryCreateSchema = z.object({
  startedAtUtc: isoUtc,
  endedAtUtc: isoUtc,
  taskId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  note: z.string().max(2000).optional(),
});

export const exportCreateSchema = z.object({
  format: z.enum(["pdf", "csv", "xlsx", "json"]),
  reportType: z.enum(["tasks", "time", "progress", "schedule", "full_backup"]),
  fromUtc: isoUtc.optional(),
  toUtc: isoUtc.optional(),
  locale: z.enum(["fa", "en"]).default("fa"),
});

export const planProposalCreateSchema = z.object({
  promptSummary: z.string().max(5000).optional(),
});
