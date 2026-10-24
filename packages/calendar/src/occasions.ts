/**
 * Fixed Solar Hijri national occasions (month 1–12, day).
 * Variable religious dates are omitted — they require a lunar converter.
 */
export type Occasion = {
  month: number;
  day: number;
  title: string;
  kind: "national" | "cultural";
};

export const FIXED_JALALI_OCCASIONS: Occasion[] = [
  { month: 1, day: 1, title: "Nowruz", kind: "national" },
  { month: 1, day: 2, title: "Nowruz holiday", kind: "national" },
  { month: 1, day: 3, title: "Nowruz holiday", kind: "national" },
  { month: 1, day: 4, title: "Nowruz holiday", kind: "national" },
  { month: 1, day: 12, title: "Islamic Republic Day", kind: "national" },
  { month: 1, day: 13, title: "Sizdah Bedar", kind: "cultural" },
  { month: 3, day: 14, title: "Demise of Imam Khomeini", kind: "national" },
  { month: 3, day: 15, title: "15 Khordad uprising", kind: "national" },
  { month: 11, day: 22, title: "Victory of the Islamic Revolution", kind: "national" },
  { month: 12, day: 29, title: "Nationalization of the Oil Industry", kind: "national" },
];

export function occasionsForDay(month: number, day: number): Occasion[] {
  return FIXED_JALALI_OCCASIONS.filter((o) => o.month === month && o.day === day);
}
