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
        id: ctx.workspace.id,
        name: ctx.workspace.name,
        kind: "personal" as const,
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
