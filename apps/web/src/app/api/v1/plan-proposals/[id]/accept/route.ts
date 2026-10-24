import { getPrisma, PlanProposalService, PlanProposalServiceError } from "@pfmp/database";
import { NextResponse } from "next/server";
import { AppError, withAuth } from "@/lib/api-handler";

export const POST = withAuth(async (_req, ctx, params) => {
  try {
    const out = await new PlanProposalService(getPrisma()).accept(
      ctx.workspace.id,
      params.id!,
      ctx.userId,
    );
    return NextResponse.json({ data: out });
  } catch (err) {
    if (err instanceof PlanProposalServiceError)
      throw new AppError(err.code === "CONFLICT" ? "CONFLICT" : "NOT_FOUND", err.message, err.code === "CONFLICT" ? 409 : 404);
    throw err;
  }
});
