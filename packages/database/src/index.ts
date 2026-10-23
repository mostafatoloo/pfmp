export {
  createPrismaClient,
  getPrisma,
  parseSqlServerUrl,
  type MssqlConfig,
  type PrismaClient,
} from "./client";
export { WorkspaceRepository, type PersonalWorkspace } from "./workspace-repository";
export { SOFT_DELETE_FILTER, utcNow, durationSecondsBetween } from "./conventions";
export { TaskRepository } from "./task-repository";
export { TaskService, TaskServiceError } from "./task-service";
export { ProjectService, ProjectServiceError } from "./project-service";
export { AcademicService, AcademicServiceError } from "./academic-service";
export { ScheduleService, ScheduleServiceError } from "./schedule-service";
export { TimeService, TimeServiceError } from "./time-service";
export { PomodoroService, PomodoroServiceError } from "./pomodoro-service";
export { ProgressQueryService } from "./progress-service";
export { CalendarQueryService, type CalendarItem } from "./calendar-service";
export { JobQueue, type JobType } from "./job-queue";
export { ExportService, ExportServiceError } from "./export-service";
export { NotificationService, NotificationServiceError } from "./notification-service";
export { PlanProposalService, PlanProposalServiceError } from "./plan-proposal-service";

// Phase 2
export { FamilyService, FamilyServiceError } from "./family-service";
export {
  canInvite,
  canManageMembers,
  canRemoveMember,
  canEditSharedResources,
  canAdminWorkspace,
  isFamilyRole,
  isValidRole,
  hasRoleAtLeast,
  type FamilyRole,
  type WorkspaceRole,
} from "./family-roles";
export { MealService, MealServiceError } from "./meal-service";
export { TelegramService, TelegramServiceError } from "./telegram-service";
export { NotificationPreferenceService } from "./notification-preference-service";
export {
  RecurrenceService,
  RecurrenceServiceError,
  parseRecurrenceRule,
  computeNextOccurrence,
  type RecurrenceRule,
  type RecurrenceFrequency,
} from "./recurrence-service";
export {
  AssistantContextService,
  type AssistantSummary,
} from "./assistant-context-service";
export { TimetableService, TimetableServiceError, type TimetableKind } from "./timetable-service";
