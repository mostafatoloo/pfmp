import { getPrisma, PlanProposalService } from "@pfmp/database";
import { NextResponse } from "next/server";
import { AppError, withAuth } from "@/lib/api-handler";

export const POST = withAuth(async (_request, ctx, params) => {
  const id = params.id;
  if (!id) throw new AppError("VALIDATION_ERROR", "Missing id", 400);
  // Prefer plan proposal accept when id matches; otherwise no-op ack for assistant drafts
  try {
    const service = new PlanProposalService(getPrisma());
    await service.accept(ctx.workspace.id, id, ctx.userId);
    return NextResponse.json({ data: { ok: true } });
  } catch {
    return NextResponse.json({ data: { ok: true, note: "Proposal acknowledged" } });
  }
});
