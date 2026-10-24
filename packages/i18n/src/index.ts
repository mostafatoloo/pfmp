export {
  LOCALES,
  DEFAULT_LOCALE,
  LOCALE_CODES,
  enabledLocales,
  resolveLocale,
  directionForLocale,
  contentDirectionForLocale,
  messagesLocaleFor,
  documentLocaleAttrs,
  type LocaleDefinition,
  type LocaleCode,
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
export { faMessages } from "./messages/fa";
export { finglishMessages } from "./messages/finglish";

// Client hooks live in `@pfmp/i18n/react` so Server Components can import this entry safely.
