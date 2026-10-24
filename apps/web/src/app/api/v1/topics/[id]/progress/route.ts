import { getPrisma, AcademicService, AcademicServiceError } from "@pfmp/database";
import { topicProgressUpdateSchema } from "@pfmp/api-contracts";
import { NextResponse } from "next/server";
import { AppError, readJson, withAuth } from "@/lib/api-handler";

function mapErr(err: unknown): never {
  if (err instanceof AcademicServiceError)
    throw new AppError(err.code, err.message, err.code === "NOT_FOUND" ? 404 : 400);
  throw err;
}

export const GET = withAuth(async (_req, ctx, params) => {
  try {
    const row = await new AcademicService(getPrisma()).getTopicProgress(
      ctx.workspace.id,
      params.id!,
    );
    return NextResponse.json({ data: row });
  } catch (err) {
    mapErr(err);
  }
});

export const PATCH = withAuth(async (req, ctx, params) => {
  const body = await readJson(req, topicProgressUpdateSchema);
  try {
    const row = await new AcademicService(getPrisma()).upsertTopicProgress(
      ctx.workspace.id,
      params.id!,
      body,
    );
    return NextResponse.json({ data: row });
  } catch (err) {
    mapErr(err);
  }
});
