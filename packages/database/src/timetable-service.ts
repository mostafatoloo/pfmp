import type { PrismaClient } from "./client";
import { utcNow } from "./conventions";

export type TimetableKind = "school_class" | "study_session" | "other_class";
export type SchoolWeekPattern = "sat_thu" | "sat_wed";

export type StudySettingsDto = {
  schoolStartMinutes: number;
  schoolEndMinutes: number;
  schoolWeekPattern: SchoolWeekPattern;
  defaultColumnCount: number;
  dayStartMinutes: number;
  dayEndMinutes: number;
};

export const DEFAULT_STUDY_SETTINGS: StudySettingsDto = {
  schoolStartMinutes: 480,
  schoolEndMinutes: 780,
  schoolWeekPattern: "sat_thu",
  defaultColumnCount: 7,
  dayStartMinutes: 420,
  dayEndMinutes: 1320,
};

/** JS getDay() values for school days */
export function schoolDaysForPattern(pattern: SchoolWeekPattern): number[] {
  // Sat–Thu: 6,0,1,2,3,4 · Sat–Wed: 6,0,1,2,3
  return pattern === "sat_wed" ? [6, 0, 1, 2, 3] : [6, 0, 1, 2, 3, 4];
}

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

function assertSlotTimes(startMinutes: number, endMinutes: number) {
  if (startMinutes < 0 || startMinutes > 1439) {
    throw new TimetableServiceError("VALIDATION", "startMinutes must be 0–1439");
  }
  if (endMinutes < 1 || endMinutes > 1440) {
    throw new TimetableServiceError("VALIDATION", "endMinutes must be 1–1440");
  }
  if (endMinutes <= startMinutes) {
    throw new TimetableServiceError("VALIDATION", "End must be after start");
  }
}

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
      description?: string | null;
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
    assertSlotTimes(input.startMinutes, input.endMinutes);
    const title = input.title.trim();
    if (!title) throw new TimetableServiceError("VALIDATION", "Title required");

    return this.prisma.timetableSlot.create({
      data: {
        workspaceId,
        kind: input.kind,
        title,
        description: input.description?.trim() || null,
        dayOfWeek: input.dayOfWeek,
        startMinutes: input.startMinutes,
        endMinutes: input.endMinutes,
        classType: input.classType ?? null,
        notes: input.notes ?? null,
      },
    });
  }

  async update(
    workspaceId: string,
    id: string,
    input: {
      kind?: TimetableKind;
      title?: string;
      description?: string | null;
      dayOfWeek?: number;
      startMinutes?: number;
      endMinutes?: number;
      classType?: string | null;
      notes?: string | null;
    },
  ) {
    const row = await this.prisma.timetableSlot.findFirst({
      where: { id, workspaceId, deletedAtUtc: null },
    });
    if (!row) throw new TimetableServiceError("NOT_FOUND", "Slot not found");

    if (input.kind !== undefined && !KINDS.has(input.kind)) {
      throw new TimetableServiceError("VALIDATION", "Invalid kind");
    }
    if (input.dayOfWeek !== undefined && (input.dayOfWeek < 0 || input.dayOfWeek > 6)) {
      throw new TimetableServiceError("VALIDATION", "dayOfWeek must be 0–6");
    }

    const startMinutes = input.startMinutes ?? row.startMinutes;
    const endMinutes = input.endMinutes ?? row.endMinutes;
    assertSlotTimes(startMinutes, endMinutes);

    const title = input.title !== undefined ? input.title.trim() : row.title;
    if (!title) throw new TimetableServiceError("VALIDATION", "Title required");

    return this.prisma.timetableSlot.update({
      where: { id },
      data: {
        kind: input.kind,
        title,
        description:
          input.description === undefined ? undefined : input.description?.trim() || null,
        dayOfWeek: input.dayOfWeek,
        startMinutes: input.startMinutes,
        endMinutes: input.endMinutes,
        classType: input.classType === undefined ? undefined : input.classType,
        notes: input.notes === undefined ? undefined : input.notes,
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

  async getSettings(workspaceId: string): Promise<StudySettingsDto> {
    const row = await this.prisma.studySettings.findUnique({ where: { workspaceId } });
    if (!row) return { ...DEFAULT_STUDY_SETTINGS };
    return {
      schoolStartMinutes: row.schoolStartMinutes,
      schoolEndMinutes: row.schoolEndMinutes,
      schoolWeekPattern: (row.schoolWeekPattern === "sat_wed" ? "sat_wed" : "sat_thu") as SchoolWeekPattern,
      defaultColumnCount: row.defaultColumnCount,
      dayStartMinutes: row.dayStartMinutes,
      dayEndMinutes: row.dayEndMinutes,
    };
  }

  async upsertSettings(
    workspaceId: string,
    input: Partial<StudySettingsDto>,
  ): Promise<StudySettingsDto> {
    const current = await this.getSettings(workspaceId);
    const next: StudySettingsDto = {
      schoolStartMinutes: input.schoolStartMinutes ?? current.schoolStartMinutes,
      schoolEndMinutes: input.schoolEndMinutes ?? current.schoolEndMinutes,
      schoolWeekPattern: input.schoolWeekPattern ?? current.schoolWeekPattern,
      defaultColumnCount: input.defaultColumnCount ?? current.defaultColumnCount,
      dayStartMinutes: input.dayStartMinutes ?? current.dayStartMinutes,
      dayEndMinutes: input.dayEndMinutes ?? current.dayEndMinutes,
    };

    if (next.schoolEndMinutes <= next.schoolStartMinutes) {
      throw new TimetableServiceError("VALIDATION", "School end must be after start");
    }
    if (next.dayEndMinutes <= next.dayStartMinutes) {
      throw new TimetableServiceError("VALIDATION", "Day end must be after start");
    }
    if (next.defaultColumnCount < 1 || next.defaultColumnCount > 16) {
      throw new TimetableServiceError("VALIDATION", "Column count must be 1–16");
    }
    if (next.schoolWeekPattern !== "sat_thu" && next.schoolWeekPattern !== "sat_wed") {
      throw new TimetableServiceError("VALIDATION", "Invalid school week pattern");
    }

    await this.prisma.studySettings.upsert({
      where: { workspaceId },
      create: { workspaceId, ...next },
      update: { ...next },
    });

    return next;
  }

  /**
   * Replace school_class slots for the given days by splitting the school window
   * equally across the provided subject titles (in order).
   */
  async applySchoolDaySubjects(
    workspaceId: string,
    dayOfWeek: number,
    subjects: string[],
    schoolStartMinutes: number,
    schoolEndMinutes: number,
  ) {
    if (dayOfWeek < 0 || dayOfWeek > 6) {
      throw new TimetableServiceError("VALIDATION", "dayOfWeek must be 0–6");
    }
    assertSlotTimes(schoolStartMinutes, schoolEndMinutes);
    const titles = subjects.map((s) => s.trim()).filter(Boolean);
    if (titles.length === 0) {
      throw new TimetableServiceError("VALIDATION", "At least one subject required");
    }

    const existing = await this.prisma.timetableSlot.findMany({
      where: {
        workspaceId,
        dayOfWeek,
        kind: "school_class",
        deletedAtUtc: null,
      },
    });
    if (existing.length > 0) {
      await this.prisma.timetableSlot.updateMany({
        where: { id: { in: existing.map((r) => r.id) } },
        data: { deletedAtUtc: utcNow() },
      });
    }

    const span = schoolEndMinutes - schoolStartMinutes;
    const created = [];
    for (let i = 0; i < titles.length; i++) {
      const startMinutes = schoolStartMinutes + Math.round((span * i) / titles.length);
      const endMinutes = schoolStartMinutes + Math.round((span * (i + 1)) / titles.length);
      created.push(
        await this.prisma.timetableSlot.create({
          data: {
            workspaceId,
            kind: "school_class",
            title: titles[i]!,
            dayOfWeek,
            startMinutes,
            endMinutes: Math.max(endMinutes, startMinutes + 1),
          },
        }),
      );
    }
    return created;
  }
}
