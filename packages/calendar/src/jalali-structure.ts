import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  getMonth,
  getYear,
  newDate,
  startOfMonth,
  startOfWeek,
} from "date-fns-jalali";

/** Persian month names (English labels; calendar is Solar Hijri). */
export const JALALI_MONTHS = [
  "Farvardin",
  "Ordibehesht",
  "Khordad",
  "Tir",
  "Mordad",
  "Shahrivar",
  "Mehr",
  "Aban",
  "Azar",
  "Dey",
  "Bahman",
  "Esfand",
] as const;

/** Iranian week starts Saturday. */
export const IR_WEEKDAY_LABELS = [
  "Saturday",
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
] as const;

export type JalaliDayCell = {
  date: Date;
  jalaliDay: number;
  jalaliMonth: number;
  jalaliYear: number;
  /** 0=Sun … 6=Sat */
  weekday: number;
  isoDate: string;
  inMonth: boolean;
};

export type JalaliWeek = {
  weekIndex: number;
  days: JalaliDayCell[];
};

export type JalaliMonthBlock = {
  monthIndex: number;
  monthName: string;
  year: number;
  weeks: JalaliWeek[];
};

function cellFromDate(date: Date, inMonth: boolean): JalaliDayCell {
  return {
    date,
    jalaliDay: Number(format(date, "d")),
    jalaliMonth: getMonth(date) + 1,
    jalaliYear: getYear(date),
    weekday: getDay(date),
    isoDate: date.toISOString(),
    inMonth,
  };
}

/** Build Saturday-start weeks for one Jalali month. */
export function buildJalaliMonth(year: number, monthIndex0: number): JalaliMonthBlock {
  const monthStart = startOfMonth(newDate(year, monthIndex0, 1));
  const monthEnd = endOfMonth(monthStart);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 6 });
  const lastWeekStart = startOfWeek(monthEnd, { weekStartsOn: 6 });
  const gridEnd = addDays(lastWeekStart, 6);

  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const weeks: JalaliWeek[] = [];
  for (let i = 0; i < days.length; i += 7) {
    const slice = days.slice(i, i + 7);
    weeks.push({
      weekIndex: weeks.length,
      days: slice.map((d) =>
        cellFromDate(d, getMonth(d) === monthIndex0 && getYear(d) === year),
      ),
    });
  }

  return {
    monthIndex: monthIndex0,
    monthName: JALALI_MONTHS[monthIndex0] ?? `Month ${monthIndex0 + 1}`,
    year,
    weeks,
  };
}

export function buildJalaliYear(year: number): JalaliMonthBlock[] {
  return Array.from({ length: 12 }, (_, m) => buildJalaliMonth(year, m));
}

export function currentJalaliYear(date = new Date()): number {
  return getYear(date);
}

export function jalaliKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}
