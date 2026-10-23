export type NavItem = {
  href: string;
  /** English label for Stage 3; i18n keys later */
  label: string;
  /** Persian label placeholder for RTL readiness */
  labelFa: string;
};

export const APP_NAV: NavItem[] = [
  { href: "/today", label: "Today", labelFa: "امروز" },
  { href: "/tasks", label: "Tasks", labelFa: "کارها" },
  { href: "/study", label: "Study", labelFa: "مطالعه" },
  { href: "/calendar", label: "Calendar", labelFa: "تقویم" },
  { href: "/time", label: "Time", labelFa: "زمان" },
  { href: "/reports", label: "Reports", labelFa: "گزارش‌ها" },
  { href: "/settings", label: "Settings", labelFa: "تنظیمات" },
];

export const DEFAULT_APP_PATH = "/today";
