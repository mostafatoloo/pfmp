import type { PrismaClient } from "./client";
import { utcNow } from "./conventions";

export type TimetableKind = "school_class" | "study_session" | "other_class";

export class TimetableServiceError extends Error {
  constructor(
    readonly code: "NOT_FOUND" | "VALIDATION",
    message: string,
  ) {
    super(message);
    this.name = "TimetableServiceError";
  }
}

const KINDS = new Set<TimetableKind>(["school_class", "study_session", "other_class"]);

export class TimetableService {
  constructor(private readonly prisma: PrismaClient) {}

  list(workspaceId: string) {
    return this.prisma.timetableSlot.findMany({
      where: { workspaceId, deletedAtUtc: null },
      orderBy: [{ dayOfWeek: "asc" }, { startMinutes: "asc" }],
    });
  }

  async create(
    workspaceId: string,
    input: {
      kind: TimetableKind;
      title: string;
      dayOfWeek: number;
      startMinutes: number;
      endMinutes: number;
      classType?: string | null;
      notes?: string | null;
    },
  ) {
    if (!KINDS.has(input.kind)) throw new TimetableServiceError("VALIDATION", "Invalid kind");
    if (input.dayOfWeek < 0 || input.dayOfWeek > 6) {
      throw new TimetableServiceError("VALIDATION", "dayOfWeek must be 0–6");
    }
    if (input.endMinutes <= input.startMinutes) {
      throw new TimetableServiceError("VALIDATION", "End must be after start");
    }
    const title = input.title.trim();
    if (!title) throw new TimetableServiceError("VALIDATION", "Title required");

    return this.prisma.timetableSlot.create({
      data: {
        workspaceId,
        kind: input.kind,
        title,
        dayOfWeek: input.dayOfWeek,
        startMinutes: input.startMinutes,
        endMinutes: input.endMinutes,
        classType: input.classType ?? null,
        notes: input.notes ?? null,
      },
    });
  }

  async remove(workspaceId: string, id: string) {
    const row = await this.prisma.timetableSlot.findFirst({
      where: { id, workspaceId, deletedAtUtc: null },
    });
    if (!row) throw new TimetableServiceError("NOT_FOUND", "Slot not found");
    return this.prisma.timetableSlot.update({
      where: { id },
      data: { deletedAtUtc: utcNow() },
    });
  }
}
