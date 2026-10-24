import type { MessageCatalog } from "../en";
import { enMessages } from "../en";
import { common } from "./common";
import { nav } from "./nav";
import { settings } from "./settings";
import { study } from "./study";

/**
 * Persian UI catalog — translated namespaces override English; the rest fall back at runtime.
 */
export const faMessages = {
  ...enMessages,
  common: { ...enMessages.common, ...common },
  nav: { ...enMessages.nav, ...nav },
  settings: { ...enMessages.settings, ...settings },
  study: { ...enMessages.study, ...study },
} satisfies MessageCatalog;
