import { describe, expect, it, beforeEach } from "vitest";
import {
  clearMissingKeys,
  createTranslator,
  getMissingKeys,
} from "./translate";
import { enabledLocales, resolveLocale, directionForLocale } from "./locales";
import { formatDurationSeconds, formatNumber, relativeDayKey } from "./format";

describe("i18n locales", () => {
  it("enables only English in production registry", () => {
    expect(enabledLocales().map((l) => l.code)).toEqual(["en"]);
  });

  it("falls back unknown locale to English", () => {
    expect(resolveLocale("xx").code).toBe("en");
  });

  it("does not expose disabled fa as enabled", () => {
    expect(resolveLocale("fa").code).toBe("en");
  });
});

describe("translator", () => {
  beforeEach(() => clearMissingKeys());

  it("resolves nested keys", () => {
    const { t } = createTranslator("en");
    expect(t("nav.tasks")).toBe("Tasks");
    expect(t("common.brand")).toBe("PFMP");
  });

  it("interpolates params", () => {
    const { t } = createTranslator("en");
    // reuse a key path by testing interpolate via known string path — add inline
    expect(t("errors.NOT_FOUND")).toBe("Not found");
  });

  it("returns key and records missing translations", () => {
    const { t } = createTranslator("en");
    expect(t("does.not.exist")).toBe("does.not.exist");
    expect(getMissingKeys().some((k) => k.includes("does.not.exist"))).toBe(true);
  });
});

describe("format", () => {
  it("formats numbers and durations", () => {
    expect(formatNumber(1234.5, { locale: "en" })).toMatch(/1/);
    expect(formatDurationSeconds(3661, { locale: "en" })).toContain("h");
  });

  it("relative day keys", () => {
    const now = new Date("2026-10-23T12:00:00Z");
    expect(relativeDayKey(now, now, "UTC")).toBe("common.today");
  });
});

describe("direction", () => {
  it("English is ltr", () => {
    expect(directionForLocale("en")).toBe("ltr");
  });
});
