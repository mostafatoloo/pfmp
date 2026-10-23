import { z } from "zod";
import { ianaTimezone, localeCode, uuid } from "@pfmp/validation";

export const meResponseSchema = z.object({
  data: z.object({
    user: z.object({
      id: uuid,
      email: z.string().email(),
      name: z.string(),
      timezone: ianaTimezone,
      locale: localeCode,
    }),
    workspace: z.object({
      id: uuid,
      name: z.string(),
      kind: z.literal("personal"),
    }),
  }),
});

export type MeResponse = z.infer<typeof meResponseSchema>;
