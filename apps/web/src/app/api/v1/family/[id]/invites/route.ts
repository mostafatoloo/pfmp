import { getPrisma, FamilyService, FamilyServiceError } from "@pfmp/database";
import { requireWorkspaceAccess } from "@pfmp/auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { AppError, readJson, withAuth } from "@/lib/api-handler";

export const POST = withAuth(async (request, ctx, params) => {
  const workspaceId = params.id;
  if (!workspaceId) throw new AppError("VALIDATION_ERROR", "Missing workspace id", 400);
  await requireWorkspaceAccess(request.headers, workspaceId);
  const body = await readJson(
    request,
    z.object({
      email: z.string().email(),
      role: z.enum(["admin", "member"]).optional(),
    }),
  );
  const service = new FamilyService(getPrisma());
  try {
    const { invite, token } = await service.invite(
      workspaceId,
      ctx.userId,
      body.email,
      body.role ?? "member",
    );
    return NextResponse.json(
      {
        data: {
          id: invite.id,
          email: invite.email,
          expiresAtUtc: invite.expiresAtUtc.toISOString(),
          // Dev convenience — production should email the link, never log token to clients long-term
          inviteToken: token,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof FamilyServiceError) {
      const status = err.code === "FORBIDDEN" ? 403 : 400;
      throw new AppError(err.code === "FORBIDDEN" ? "FORBIDDEN" : "VALIDATION_ERROR", err.message, status);
    }
    throw err;
  }
});
