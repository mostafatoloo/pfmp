const SECRET_KEYS = /^(password|secret|authorization|cookie|api[_-]?key|database_url|accessToken|refreshToken)$/i;

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

export const logger = {
  info(message: string, meta?: Record<string, unknown>) {
    console.info(`[web] ${message}`, meta ? redact(meta) : "");
  },
  error(message: string, meta?: Record<string, unknown>) {
    console.error(`[web] ${message}`, meta ? redact(meta) : "");
  },
};
