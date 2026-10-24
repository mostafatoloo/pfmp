import { AuthzError, requireWorkspace } from "@pfmp/auth";
import { apiError } from "@pfmp/api-contracts";
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

export async function GET(request: Request) {
  const requestId = randomUUID();
  try {
    const ctx = await requireWorkspace(request.headers);
    return NextResponse.json({
      data: {
        user: {
          id: ctx.userId,
          email: ctx.email,
          name: ctx.name,
          timezone: ctx.timezone,
          locale:
            ctx.locale === "fa" || ctx.locale === "finglish" || ctx.locale === "en"
              ? ctx.locale
              : "en",
        },
        workspace: {
          id: ctx.workspace.id,
          name: ctx.workspace.name,
          kind: ctx.workspace.kind,
        },
      },
    });
  } catch (err) {
    if (err instanceof AuthzError) {
      return NextResponse.json(apiError(err.code, err.message, { requestId }), {
        status: err.status,
      });
    }
    return NextResponse.json(apiError("INTERNAL_ERROR", "Unexpected error", { requestId }), {
      status: 500,
    });
  }
}
