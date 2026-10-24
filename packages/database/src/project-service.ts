import type { PrismaClient } from "./client";
import { utcNow } from "./conventions";

export class ProjectServiceError extends Error {
  constructor(
    readonly code: "NOT_FOUND" | "VALIDATION_ERROR",
    message: string,
  ) {
    super(message);
    this.name = "ProjectServiceError";
  }
}

export class ProjectService {
  constructor(private readonly prisma: PrismaClient) {}

  create(
    workspaceId: string,
    input: { name: string; description?: string | null; billable?: boolean; status?: string },
  ) {
    return this.prisma.project.create({
      data: {
        workspaceId,
        name: input.name,
        description: input.description ?? null,
        billable: input.billable ?? false,
        status: input.status ?? "active",
      },
    });
  }

  async get(workspaceId: string, id: string) {
    const row = await this.prisma.project.findFirst({
      where: { id, workspaceId, deletedAtUtc: null },
    });
    if (!row) throw new ProjectServiceError("NOT_FOUND", "Project not found");
    return row;
  }

  list(workspaceId: string) {
    return this.prisma.project.findMany({
      where: { workspaceId, deletedAtUtc: null },
      orderBy: { updatedAtUtc: "desc" },
    });
  }

  async update(
    workspaceId: string,
    id: string,
    input: {
      name?: string;
      description?: string | null;
      billable?: boolean;
      status?: string;
    },
  ) {
    await this.get(workspaceId, id);
    return this.prisma.project.update({
      where: { id },
      data: {
        name: input.name,
        description: input.description,
        billable: input.billable,
        status: input.status,
      },
    });
  }

  async softDelete(workspaceId: string, id: string) {
    await this.get(workspaceId, id);
    await this.prisma.project.update({
      where: { id },
      data: { deletedAtUtc: utcNow() },
    });
  }

  async createActivity(
    workspaceId: string,
    projectId: string,
    input: { name: string; notes?: string | null },
  ) {
    await this.get(workspaceId, projectId);
    return this.prisma.activity.create({
      data: {
        workspaceId,
        projectId,
        name: input.name,
        notes: input.notes ?? null,
      },
    });
  }

  async listActivities(workspaceId: string, projectId: string) {
    await this.get(workspaceId, projectId);
    return this.prisma.activity.findMany({
      where: { workspaceId, projectId, deletedAtUtc: null },
      orderBy: { createdAtUtc: "asc" },
    });
  }

  async getActivity(workspaceId: string, projectId: string, activityId: string) {
    const row = await this.prisma.activity.findFirst({
      where: { id: activityId, workspaceId, projectId, deletedAtUtc: null },
    });
    if (!row) throw new ProjectServiceError("NOT_FOUND", "Activity not found");
    return row;
  }

  async updateActivity(
    workspaceId: string,
    projectId: string,
    activityId: string,
    input: { name?: string; notes?: string | null },
  ) {
    await this.getActivity(workspaceId, projectId, activityId);
    return this.prisma.activity.update({
      where: { id: activityId },
      data: { name: input.name, notes: input.notes },
    });
  }

  async softDeleteActivity(workspaceId: string, projectId: string, activityId: string) {
    await this.getActivity(workspaceId, projectId, activityId);
    await this.prisma.activity.update({
      where: { id: activityId },
      data: { deletedAtUtc: utcNow() },
    });
  }
}
