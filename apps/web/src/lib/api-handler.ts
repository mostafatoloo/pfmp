import { AuthzError, requireWorkspace, type AuthedContext } from "@pfmp/auth";
import { apiError, type ErrorCode } from "@pfmp/api-contracts";
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { ZodError } from "zod";

export class AppError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly status: number,
    readonly details?: { path: (string | number)[]; message: string }[],
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function notFound(entity = "Resource"): never {
  throw new AppError("NOT_FOUND", `${entity} not found`, 404);
}

export function conflict(message: string, code: ErrorCode = "CONFLICT"): never {
  throw new AppError(code, message, 409);
}

export function badRequest(message: string, code: ErrorCode = "VALIDATION_ERROR"): never {
  throw new AppError(code, message, 400);
}

type Handler = (
  request: Request,
  ctx: AuthedContext,
  params: Record<string, string>,
) => Promise<Response> | Response;

type RouteContext = { params: Promise<Record<string, string>> };

export function withAuth(handler: Handler) {
  return async (request: Request, route: RouteContext): Promise<Response> => {
    const requestId = randomUUID();
    try {
      const ctx = await requireWorkspace(request.headers);
      const params = (await route?.params) ?? {};
      return await handler(request, ctx, params);
    } catch (err) {
      if (err instanceof AuthzError) {
        return NextResponse.json(apiError(err.code, err.message, { requestId }), {
          status: err.status,
        });
      }
      if (err instanceof AppError) {
        return NextResponse.json(
          apiError(err.code, err.message, { requestId, details: err.details }),
          { status: err.status },
        );
      }
      if (err instanceof ZodError) {
        return NextResponse.json(
          apiError("VALIDATION_ERROR", "Invalid request", {
            requestId,
            details: err.issues.map((i) => ({
              path: i.path.filter(
                (p): p is string | number => typeof p === "string" || typeof p === "number",
              ),
              message: i.message,
            })),
          }),
          { status: 400 },
        );
      }
      console.error("[web] unhandled", err instanceof Error ? err.message : err);
      return NextResponse.json(apiError("INTERNAL_ERROR", "Unexpected error", { requestId }), {
        status: 500,
      });
    }
  };
}

export async function readJson<T>(
  request: Request,
  schema: { parse: (v: unknown) => T },
): Promise<T> {
  const body = await request.json().catch(() => ({}));
  return schema.parse(body);
}
