import { getPrisma, PlanProposalService, PlanProposalServiceError } from "@pfmp/database";
import { planProposalCreateSchema } from "@pfmp/api-contracts";
import { NextResponse } from "next/server";
import { AppError, readJson, withAuth } from "@/lib/api-handler";

export const GET = withAuth(async (_req, ctx) => {
  const rows = await new PlanProposalService(getPrisma()).list(ctx.workspace.id);
  return NextResponse.json({ data: rows });
});

export const POST = withAuth(async (req, ctx) => {
  const body = await readJson(req, planProposalCreateSchema);
  const aiEnabled = process.env.AI_ENABLED === "true";
  try {
    const out = await new PlanProposalService(getPrisma()).request(ctx.workspace.id, {
      aiEnabled,
      promptSummary: body.promptSummary,
    });
    return NextResponse.json({ data: out }, { status: 201 });
  } catch (err) {
    if (err instanceof PlanProposalServiceError) {
      if (err.code === "AI_UNAVAILABLE")
        throw new AppError("AI_UNAVAILABLE", err.message, 503);
      throw new AppError("VALIDATION_ERROR", err.message, 400);
    }
    throw err;
  }
});
