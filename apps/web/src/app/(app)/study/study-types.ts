export type TimetableKind = "school_class" | "study_session" | "other_class";
export type SchoolWeekPattern = "sat_thu" | "sat_wed";

export type TimetableSlotDto = {
  id: string;
  kind: TimetableKind | string;
  title: string;
  description: string | null;
  dayOfWeek: number;
  startMinutes: number;
  endMinutes: number;
  classType: string | null;
  notes: string | null;
};

export type StudySettingsDto = {
  schoolStartMinutes: number;
  schoolEndMinutes: number;
  schoolWeekPattern: SchoolWeekPattern;
  defaultColumnCount: number;
  dayStartMinutes: number;
  dayEndMinutes: number;
};

/** Week rows in Iranian school order: Saturday → Friday */
export const WEEK_DAYS = [
  { js: 6, label: "Saturday", short: "Sat" },
  { js: 0, label: "Sunday", short: "Sun" },
  { js: 1, label: "Monday", short: "Mon" },
  { js: 2, label: "Tuesday", short: "Tue" },
  { js: 3, label: "Wednesday", short: "Wed" },
  { js: 4, label: "Thursday", short: "Thu" },
  { js: 5, label: "Friday", short: "Fri" },
] as const;

export function schoolDaysForPattern(pattern: SchoolWeekPattern): Set<number> {
  return new Set(pattern === "sat_wed" ? [6, 0, 1, 2, 3] : [6, 0, 1, 2, 3, 4]);
}

export function fmtMinutes(mins: number) {
  const clamped = Math.max(0, Math.min(1440, Math.round(mins)));
  const h = Math.floor(clamped / 60) % 24;
  const m = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function parseTimeInput(value: string): number {
  const [h, m] = value.split(":").map(Number);
  return Math.max(0, Math.min(1439, (h ?? 0) * 60 + (m ?? 0)));
}

export function minutesToTimeInput(mins: number) {
  return fmtMinutes(mins);
}

export function snapMinutes(mins: number, step = 5) {
  return Math.round(mins / step) * step;
}

export function kindLabel(kind: string) {
  switch (kind) {
    case "school_class":
      return "School";
    case "study_session":
      return "Study";
    case "other_class":
      return "Other";
    default:
      return kind;
  }
}
