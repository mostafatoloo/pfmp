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

/** Week rows in Iranian school order: Saturday → Friday (labels via i18n). */
export const WEEK_DAYS = [
  { js: 6, labelKey: "common.weekdaySat", shortKey: "common.weekdaySatShort" },
  { js: 0, labelKey: "common.weekdaySun", shortKey: "common.weekdaySunShort" },
  { js: 1, labelKey: "common.weekdayMon", shortKey: "common.weekdayMonShort" },
  { js: 2, labelKey: "common.weekdayTue", shortKey: "common.weekdayTueShort" },
  { js: 3, labelKey: "common.weekdayWed", shortKey: "common.weekdayWedShort" },
  { js: 4, labelKey: "common.weekdayThu", shortKey: "common.weekdayThuShort" },
  { js: 5, labelKey: "common.weekdayFri", shortKey: "common.weekdayFriShort" },
] as const;

export function kindLabelKey(kind: string) {
  switch (kind) {
    case "school_class":
      return "study.kindSchool";
    case "study_session":
      return "study.kindStudy";
    case "other_class":
      return "study.kindOther";
    default:
      return "study.kindOther";
  }
}

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

