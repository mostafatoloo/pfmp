import { getPrisma, AcademicService, AcademicServiceError } from "@pfmp/database";
import { topicCreateSchema } from "@pfmp/api-contracts";
import { NextResponse } from "next/server";
import { AppError, readJson, withAuth } from "@/lib/api-handler";

function mapErr(err: unknown): never {
  if (err instanceof AcademicServiceError)
    throw new AppError(err.code, err.message, err.code === "NOT_FOUND" ? 404 : 400);
  throw err;
}

export const GET = withAuth(async (req, ctx) => {
  const courseId = new URL(req.url).searchParams.get("courseId") ?? undefined;
  const rows = await new AcademicService(getPrisma()).listTopics(ctx.workspace.id, courseId);
  return NextResponse.json({ data: rows });
});

export const POST = withAuth(async (req, ctx) => {
  const body = await readJson(req, topicCreateSchema);
  try {
    const row = await new AcademicService(getPrisma()).createTopic(ctx.workspace.id, body);
    return NextResponse.json({ data: row }, { status: 201 });
  } catch (err) {
    mapErr(err);
  }
});
