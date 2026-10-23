export {
  LOCALES,
  DEFAULT_LOCALE,
  enabledLocales,
  resolveLocale,
  directionForLocale,
  documentLocaleAttrs,
  type LocaleDefinition,
  type TextDirection,
  type CalendarSystem,
} from "./locales";

export {
  createTranslator,
  registerCatalog,
  setMissingKeyHandler,
  getMissingKeys,
  clearMissingKeys,
  type Translator,
  type TranslateParams,
  type MissingKeyHandler,
} from "./translate";

export {
  formatNumber,
  formatPercent,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatDurationSeconds,
  relativeDayKey,
  weekStartsOn,
  type FormatPrefs,
} from "./format";

export { enMessages, type MessageCatalog } from "./messages/en";

// Client hooks live in `@pfmp/i18n/react` so Server Components can import this entry safely.
