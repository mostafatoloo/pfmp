import { z } from "zod";

/** Integer seconds — never float hours */
export const durationSeconds = z.number().int().nonnegative();

/** ISO-8601 UTC datetime strings */
export const isoUtc = z.string().datetime({ offset: true });

/** Calendar date only (YYYY-MM-DD) */
export const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const ianaTimezone = z.string().min(1).max(64);

export const localeCode = z.enum(["en", "fa"]);

export const uuid = z.string().uuid();

export function stripUnknown<T extends z.ZodTypeAny>(schema: T) {
  return schema;
}

export { z };
