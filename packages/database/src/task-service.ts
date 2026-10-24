import { canTransitionTaskStatus, type TaskStatus } from "@pfmp/domain";
import type { PrismaClient } from "./client";
import {
  TaskRepository,
  type TaskCreateInput,
  type TaskListFilters,
  type TaskRecord,
  type TaskUpdateInput,
} from "./task-repository";

export class TaskServiceError extends Error {
  constructor(
    readonly code: "NOT_FOUND" | "INVALID_STATUS_TRANSITION" | "VALIDATION_ERROR",
    message: string,
  ) {
    super(message);
    this.name = "TaskServiceError";
  }
}

export class TaskService {
  private readonly repo: TaskRepository;

  constructor(prisma: PrismaClient) {
    this.repo = new TaskRepository(prisma);
  }

  create(workspaceId: string, actorUserId: string, input: TaskCreateInput) {
    return this.repo.create(workspaceId, actorUserId, input);
  }

  async get(workspaceId: string, id: string): Promise<TaskRecord> {
    const task = await this.repo.getById(workspaceId, id);
    if (!task) throw new TaskServiceError("NOT_FOUND", "Task not found");
    return task;
  }

  list(workspaceId: string, filters?: TaskListFilters) {
    return this.repo.list(workspaceId, filters);
  }

  async update(
    workspaceId: string,
    id: string,
    actorUserId: string,
    input: TaskUpdateInput,
  ): Promise<TaskRecord> {
    const existing = await this.repo.getById(workspaceId, id);
    if (!existing) throw new TaskServiceError("NOT_FOUND", "Task not found");

    if (input.status && input.status !== existing.status) {
      if (
        !canTransitionTaskStatus(existing.status as TaskStatus, input.status as TaskStatus)
      ) {
        throw new TaskServiceError(
          "INVALID_STATUS_TRANSITION",
          `Cannot transition from ${existing.status} to ${input.status}`,
        );
      }
    }

    const updated = await this.repo.update(workspaceId, id, actorUserId, input);
    if (!updated) throw new TaskServiceError("NOT_FOUND", "Task not found");
    return updated;
  }

  async softDelete(workspaceId: string, id: string, actorUserId: string): Promise<void> {
    const ok = await this.repo.softDelete(workspaceId, id, actorUserId);
    if (!ok) throw new TaskServiceError("NOT_FOUND", "Task not found");
  }

  async history(workspaceId: string, taskId: string) {
    const rows = await this.repo.listHistory(workspaceId, taskId);
    if (!rows) throw new TaskServiceError("NOT_FOUND", "Task not found");
    return rows;
  }
}
