import { describe, expect, it, beforeEach } from "vitest";
import {
  clearMissingKeys,
  createTranslator,
  getMissingKeys,
} from "./translate";
import {
  contentDirectionForLocale,
  enabledLocales,
  resolveLocale,
  directionForLocale,
  messagesLocaleFor,
} from "./locales";
import { formatDurationSeconds, formatNumber, relativeDayKey } from "./format";

describe("i18n locales", () => {
  it("exposes English, Finglish, and Persian", () => {
    expect(enabledLocales().map((l) => l.code).sort()).toEqual(["en", "fa", "finglish"]);
  });

  it("falls back unknown locale to English", () => {
    expect(resolveLocale("xx").code).toBe("en");
  });

  it("resolves finglish as LTR with finglish messages", () => {
    expect(resolveLocale("finglish").code).toBe("finglish");
    expect(directionForLocale("finglish")).toBe("ltr");
    expect(contentDirectionForLocale("finglish")).toBe("ltr");
    expect(messagesLocaleFor("finglish")).toBe("finglish");
  });

  it("resolves Persian as full-site RTL", () => {
    expect(directionForLocale("fa")).toBe("rtl");
    expect(contentDirectionForLocale("fa")).toBe("rtl");
    expect(messagesLocaleFor("fa")).toBe("fa");
  });
});

describe("translator", () => {
  beforeEach(() => clearMissingKeys());

  it("resolves nested keys", () => {
    const { t } = createTranslator("en");
    expect(t("nav.tasks")).toBe("Tasks");
    expect(t("common.brand")).toBe("PFMP");
  });

  it("uses Finglish Latin-Persian copy", () => {
    const { t, locale } = createTranslator("finglish");
    expect(locale).toBe("finglish");
    expect(t("nav.tasks")).toBe("Kar-ha");
    expect(t("settings.title")).toBe("Tanzimat");
  });

  it("uses Persian copy for fa", () => {
    const { t } = createTranslator("fa");
    expect(t("nav.tasks")).toBe("کارها");
    expect(t("settings.title")).toBe("تنظیمات");
    expect(t("common.weekdaySat")).toBe("شنبه");
  });

  it("interpolates params", () => {
    const { t } = createTranslator("en");
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
