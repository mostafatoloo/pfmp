export type NavItem = {
  href: string;
  /** i18n key under nav.* */
  labelKey: string;
};

export const APP_NAV: NavItem[] = [
  { href: "/today", labelKey: "nav.today" },
  { href: "/tasks", labelKey: "nav.tasks" },
  { href: "/study", labelKey: "nav.study" },
  { href: "/calendar", labelKey: "nav.calendar" },
  { href: "/reminders", labelKey: "nav.reminders" },
  { href: "/time", labelKey: "nav.time" },
  { href: "/meals", labelKey: "nav.meals" },
  { href: "/family", labelKey: "nav.family" },
  { href: "/reports", labelKey: "nav.reports" },
  { href: "/settings", labelKey: "nav.settings" },
];

export const DEFAULT_APP_PATH = "/today";
