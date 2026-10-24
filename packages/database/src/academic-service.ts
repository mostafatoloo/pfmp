import type { PrismaClient } from "./client";
import { utcNow } from "./conventions";

export class AcademicServiceError extends Error {
  constructor(
    readonly code: "NOT_FOUND" | "VALIDATION_ERROR",
    message: string,
  ) {
    super(message);
    this.name = "AcademicServiceError";
  }
}

function parseDateOnly(s: string): Date {
  return new Date(`${s}T00:00:00.000Z`);
}

export class AcademicService {
  constructor(private readonly prisma: PrismaClient) {}

  // Terms
  createTerm(workspaceId: string, input: { name: string; startsOn: string; endsOn: string }) {
    return this.prisma.term.create({
      data: {
        workspaceId,
        name: input.name,
        startsOn: parseDateOnly(input.startsOn),
        endsOn: parseDateOnly(input.endsOn),
      },
    });
  }

  async getTerm(workspaceId: string, id: string) {
    const row = await this.prisma.term.findFirst({ where: { id, workspaceId, deletedAtUtc: null } });
    if (!row) throw new AcademicServiceError("NOT_FOUND", "Term not found");
    return row;
  }

  listTerms(workspaceId: string) {
    return this.prisma.term.findMany({
      where: { workspaceId, deletedAtUtc: null },
      orderBy: { startsOn: "desc" },
    });
  }

  async updateTerm(
    workspaceId: string,
    id: string,
    input: { name?: string; startsOn?: string; endsOn?: string },
  ) {
    await this.getTerm(workspaceId, id);
    return this.prisma.term.update({
      where: { id },
      data: {
        name: input.name,
        startsOn: input.startsOn ? parseDateOnly(input.startsOn) : undefined,
        endsOn: input.endsOn ? parseDateOnly(input.endsOn) : undefined,
      },
    });
  }

  async softDeleteTerm(workspaceId: string, id: string) {
    await this.getTerm(workspaceId, id);
    await this.prisma.term.update({ where: { id }, data: { deletedAtUtc: utcNow() } });
  }

  // Courses
  async createCourse(
    workspaceId: string,
    input: { termId: string; code?: string | null; title: string },
  ) {
    await this.getTerm(workspaceId, input.termId);
    return this.prisma.course.create({
      data: {
        workspaceId,
        termId: input.termId,
        code: input.code ?? null,
        title: input.title,
      },
    });
  }

  async getCourse(workspaceId: string, id: string) {
    const row = await this.prisma.course.findFirst({
      where: { id, workspaceId, deletedAtUtc: null },
    });
    if (!row) throw new AcademicServiceError("NOT_FOUND", "Course not found");
    return row;
  }

  listCourses(workspaceId: string, termId?: string) {
    return this.prisma.course.findMany({
      where: { workspaceId, deletedAtUtc: null, ...(termId ? { termId } : {}) },
      orderBy: { title: "asc" },
    });
  }

  async updateCourse(
    workspaceId: string,
    id: string,
    input: { code?: string | null; title?: string },
  ) {
    await this.getCourse(workspaceId, id);
    return this.prisma.course.update({ where: { id }, data: input });
  }

  async softDeleteCourse(workspaceId: string, id: string) {
    await this.getCourse(workspaceId, id);
    await this.prisma.course.update({ where: { id }, data: { deletedAtUtc: utcNow() } });
  }

  // Topics
  async createTopic(
    workspaceId: string,
    input: { courseId: string; title: string; sortOrder?: number },
  ) {
    await this.getCourse(workspaceId, input.courseId);
    return this.prisma.topic.create({
      data: {
        workspaceId,
        courseId: input.courseId,
        title: input.title,
        sortOrder: input.sortOrder ?? 0,
      },
    });
  }

  async getTopic(workspaceId: string, id: string) {
    const row = await this.prisma.topic.findFirst({
      where: { id, workspaceId, deletedAtUtc: null },
    });
    if (!row) throw new AcademicServiceError("NOT_FOUND", "Topic not found");
    return row;
  }

  listTopics(workspaceId: string, courseId?: string) {
    return this.prisma.topic.findMany({
      where: { workspaceId, deletedAtUtc: null, ...(courseId ? { courseId } : {}) },
      orderBy: { sortOrder: "asc" },
    });
  }

  async updateTopic(
    workspaceId: string,
    id: string,
    input: { title?: string; sortOrder?: number },
  ) {
    await this.getTopic(workspaceId, id);
    return this.prisma.topic.update({ where: { id }, data: input });
  }

  async softDeleteTopic(workspaceId: string, id: string) {
    await this.getTopic(workspaceId, id);
    await this.prisma.topic.update({ where: { id }, data: { deletedAtUtc: utcNow() } });
  }

  // Assessments
  async createAssessment(
    workspaceId: string,
    input: {
      courseId: string;
      title: string;
      dueAtUtc?: Date | null;
      weightPercent?: number | null;
    },
  ) {
    await this.getCourse(workspaceId, input.courseId);
    return this.prisma.assessment.create({
      data: {
        workspaceId,
        courseId: input.courseId,
        title: input.title,
        dueAtUtc: input.dueAtUtc ?? null,
        weightPercent: input.weightPercent ?? null,
      },
    });
  }

  async getAssessment(workspaceId: string, id: string) {
    const row = await this.prisma.assessment.findFirst({
      where: { id, workspaceId, deletedAtUtc: null },
    });
    if (!row) throw new AcademicServiceError("NOT_FOUND", "Assessment not found");
    return row;
  }

  listAssessments(workspaceId: string, courseId?: string) {
    return this.prisma.assessment.findMany({
      where: { workspaceId, deletedAtUtc: null, ...(courseId ? { courseId } : {}) },
      orderBy: { dueAtUtc: "asc" },
    });
  }

  async updateAssessment(
    workspaceId: string,
    id: string,
    input: { title?: string; dueAtUtc?: Date | null; weightPercent?: number | null },
  ) {
    await this.getAssessment(workspaceId, id);
    return this.prisma.assessment.update({ where: { id }, data: input });
  }

  async softDeleteAssessment(workspaceId: string, id: string) {
    await this.getAssessment(workspaceId, id);
    await this.prisma.assessment.update({ where: { id }, data: { deletedAtUtc: utcNow() } });
  }

  /** Explicit progress measures only — never creates TimeEntry */
  async upsertTopicProgress(
    workspaceId: string,
    topicId: string,
    input: {
      measureType: string;
      plannedValue?: number | null;
      actualValue?: number | null;
    },
  ) {
    await this.getTopic(workspaceId, topicId);
    const existing = await this.prisma.topicProgress.findFirst({
      where: { topicId, workspaceId, deletedAtUtc: null },
    });
    if (existing) {
      return this.prisma.topicProgress.update({
        where: { id: existing.id },
        data: {
          measureType: input.measureType,
          plannedValue: input.plannedValue ?? existing.plannedValue,
          actualValue: input.actualValue ?? existing.actualValue,
        },
      });
    }
    return this.prisma.topicProgress.create({
      data: {
        workspaceId,
        topicId,
        measureType: input.measureType,
        plannedValue: input.plannedValue ?? null,
        actualValue: input.actualValue ?? null,
      },
    });
  }

  async getTopicProgress(workspaceId: string, topicId: string) {
    await this.getTopic(workspaceId, topicId);
    return this.prisma.topicProgress.findFirst({
      where: { topicId, workspaceId, deletedAtUtc: null },
    });
  }
}
