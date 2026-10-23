export const errors = {
  UNAUTHORIZED: "Authentication required",
  FORBIDDEN: "You don’t have permission",
  WORKSPACE_MISMATCH: "That resource belongs to another workspace",
  NOT_FOUND: "Not found",
  VALIDATION: "Please check the highlighted fields",
  AI_UNAVAILABLE: "AI is unavailable right now",
  INVITE_EXPIRED: "This invitation has expired",
  INVITE_INVALID: "This invitation is invalid or already used",
  TELEGRAM_NOT_CONFIGURED: "Telegram is not configured on this server",
  RATE_LIMITED: "Too many requests — try again shortly",
} as const;
