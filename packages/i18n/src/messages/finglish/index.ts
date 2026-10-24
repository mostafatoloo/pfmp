import type { MessageCatalog } from "../en";
import { assistant } from "./assistant";
import { auth } from "./auth";
import { calendarNs } from "./calendar";
import { common } from "./common";
import { errors } from "./errors";
import { family } from "./family";
import { meals } from "./meals";
import { nav } from "./nav";
import { notifications } from "./notifications";
import { reminders } from "./reminders";
import { reports } from "./reports";
import { settings } from "./settings";
import { study } from "./study";
import { tasks } from "./tasks";
import { time } from "./time";
import { today } from "./today";

export const finglishMessages = {
  common,
  nav,
  auth,
  tasks,
  today,
  study,
  time,
  reports,
  calendar: calendarNs,
  reminders,
  family,
  meals,
  settings,
  assistant,
  notifications,
  errors,
} satisfies MessageCatalog;
