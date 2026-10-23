/** Pure domain types / invariants — no I/O. */

export const TASK_STATUSES = [
  "inbox",
  "planned",
  "in_progress",
  "completed",
  "cancelled",
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

const transitions: Record<TaskStatus, readonly TaskStatus[]> = {
  inbox: ["planned", "in_progress", "cancelled"],
  planned: ["in_progress", "cancelled", "inbox"],
  in_progress: ["completed", "cancelled", "planned"],
  completed: [],
  cancelled: ["inbox", "planned"],
};

export function canTransitionTaskStatus(from: TaskStatus, to: TaskStatus): boolean {
  return transitions[from].includes(to);
}

export {
  planDeterministic,
  type PlanningBlockInput,
  type PlanningEngineInput,
  type PlanningEngineResult,
  type PlannedItem,
} from "./planning-engine";
