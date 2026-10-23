/** Redact by object key name only — do not scrub string values that merely contain “token” (e.g. magic-link URLs). */
const SECRET_KEYS = /^(password|secret|authorization|cookie|api[_-]?key|connectionstring|database_url|accessToken|refreshToken)$/i;

function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = SECRET_KEYS.test(k) ? "[REDACTED]" : redact(v);
    }
    return out;
  }
  return value;
}

export const authLogger = {
  info(message: string, meta?: Record<string, unknown>) {
    console.info(`[auth] ${message}`, meta ? redact(meta) : "");
  },
  warn(message: string, meta?: Record<string, unknown>) {
    console.warn(`[auth] ${message}`, meta ? redact(meta) : "");
  },
  error(message: string, meta?: Record<string, unknown>) {
    console.error(`[auth] ${message}`, meta ? redact(meta) : "");
  },
};
