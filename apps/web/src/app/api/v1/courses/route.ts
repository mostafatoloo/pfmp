import { getPrisma, AcademicService, AcademicServiceError } from "@pfmp/database";
import { courseCreateSchema } from "@pfmp/api-contracts";
import { NextResponse } from "next/server";
import { AppError, readJson, withAuth } from "@/lib/api-handler";

function mapErr(err: unknown): never {
  if (err instanceof AcademicServiceError)
    throw new AppError(err.code, err.message, err.code === "NOT_FOUND" ? 404 : 400);
  throw err;
}

export const GET = withAuth(async (req, ctx) => {
  const termId = new URL(req.url).searchParams.get("termId") ?? undefined;
  const rows = await new AcademicService(getPrisma()).listCourses(ctx.workspace.id, termId);
  return NextResponse.json({ data: rows });
});

export const POST = withAuth(async (req, ctx) => {
  const body = await readJson(req, courseCreateSchema);
  try {
    const row = await new AcademicService(getPrisma()).createCourse(ctx.workspace.id, body);
    return NextResponse.json({ data: row }, { status: 201 });
  } catch (err) {
    mapErr(err);
  }
});
