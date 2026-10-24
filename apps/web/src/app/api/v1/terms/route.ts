import { getPrisma, AcademicService, AcademicServiceError } from "@pfmp/database";
import { termCreateSchema } from "@pfmp/api-contracts";
import { NextResponse } from "next/server";
import { AppError, readJson, withAuth } from "@/lib/api-handler";

function mapErr(err: unknown): never {
  if (err instanceof AcademicServiceError)
    throw new AppError(err.code, err.message, err.code === "NOT_FOUND" ? 404 : 400);
  throw err;
}

export const GET = withAuth(async (_req, ctx) => {
  const rows = await new AcademicService(getPrisma()).listTerms(ctx.workspace.id);
  return NextResponse.json({
    data: rows.map((t) => ({
      id: t.id,
      name: t.name,
      startsOn: t.startsOn.toISOString().slice(0, 10),
      endsOn: t.endsOn.toISOString().slice(0, 10),
    })),
  });
});

export const POST = withAuth(async (req, ctx) => {
  const body = await readJson(req, termCreateSchema);
  try {
    const t = await new AcademicService(getPrisma()).createTerm(ctx.workspace.id, body);
    return NextResponse.json(
      {
        data: {
          id: t.id,
          name: t.name,
          startsOn: t.startsOn.toISOString().slice(0, 10),
          endsOn: t.endsOn.toISOString().slice(0, 10),
        },
      },
      { status: 201 },
    );
  } catch (err) {
    mapErr(err);
  }
});
