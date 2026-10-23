import { z } from "zod";

export const errorCodes = [
  "VALIDATION_ERROR",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "WORKSPACE_MISMATCH",
  "NOT_FOUND",
  "CONFLICT",
  "RATE_LIMITED",
  "AI_UNAVAILABLE",
  "INTERNAL_ERROR",
] as const;

export type ErrorCode = (typeof errorCodes)[number];

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.enum(errorCodes),
    message: z.string(),
    details: z
      .array(
        z.object({
          path: z.array(z.union([z.string(), z.number()])),
          message: z.string(),
        }),
      )
      .optional(),
    requestId: z.string().uuid().optional(),
  }),
});

export type ApiErrorBody = z.infer<typeof apiErrorSchema>;

export function apiError(
  code: ErrorCode,
  message: string,
  opts?: { details?: ApiErrorBody["error"]["details"]; requestId?: string },
): ApiErrorBody {
  return {
    error: {
      code,
      message,
      details: opts?.details,
      requestId: opts?.requestId,
    },
  };
}
