import { getPrisma } from "@pfmp/database";
import { NextResponse } from "next/server";
import { z } from "zod";
import { readJson, withAuth } from "@/lib/api-handler";

export const PATCH = withAuth(async (request, ctx) => {
  const body = await readJson(
    request,
    z.object({
      aiAssistantEnabled: z.boolean().optional(),
      calendarSystem: z.enum(["gregory", "persian"]).optional(),
      locale: z.enum(["en"]).optional(),
      quietHoursStart: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
      quietHoursEnd: z.string().regex(/^\d{2}:\d{2}$/).nullable().optional(),
      timezone: z.string().min(1).max(64).optional(),
    }),
  );

  const user = await getPrisma().user.update({
    where: { id: ctx.userId },
    data: {
      aiAssistantEnabled: body.aiAssistantEnabled,
      calendarSystem: body.calendarSystem,
      locale: body.locale,
      quietHoursStart: body.quietHoursStart === undefined ? undefined : body.quietHoursStart,
      quietHoursEnd: body.quietHoursEnd === undefined ? undefined : body.quietHoursEnd,
      timezone: body.timezone,
    },
  });

  return NextResponse.json({
    data: {
      aiAssistantEnabled: user.aiAssistantEnabled,
      calendarSystem: user.calendarSystem,
      locale: user.locale,
      quietHoursStart: user.quietHoursStart,
      quietHoursEnd: user.quietHoursEnd,
      timezone: user.timezone,
    },
  });
});
