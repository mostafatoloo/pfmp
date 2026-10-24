"use client";

import { createContext, useContext, type ReactNode } from "react";

export type CalendarSystemPref = "gregory" | "persian";
export type WeekStartsOnPref = 1 | 6;

export type UserPrefs = {
  calendarSystem: CalendarSystemPref;
  weekStartsOn: WeekStartsOnPref;
};

const DEFAULT_PREFS: UserPrefs = {
  calendarSystem: "persian",
  weekStartsOn: 6,
};

const UserPrefsContext = createContext<UserPrefs>(DEFAULT_PREFS);

export function UserPrefsProvider({
  calendarSystem = "persian",
  weekStartsOn = 6,
  children,
}: {
  calendarSystem?: CalendarSystemPref;
  weekStartsOn?: WeekStartsOnPref;
  children: ReactNode;
}) {
  return (
    <UserPrefsContext.Provider value={{ calendarSystem, weekStartsOn }}>
      {children}
    </UserPrefsContext.Provider>
  );
}

export function useUserPrefs(): UserPrefs {
  return useContext(UserPrefsContext);
}
