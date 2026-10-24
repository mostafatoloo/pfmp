export const errors = {
  UNAUTHORIZED: "احراز هویت لازم است",
  FORBIDDEN: "مجوز ندارید",
  WORKSPACE_MISMATCH: "این مورد متعلق به فضای کاری دیگری است",
  NOT_FOUND: "یافت نشد",
  VALIDATION: "لطفاً فیلدهای مشخص‌شده را بررسی کنید",
  AI_UNAVAILABLE: "هوش مصنوعی الان در دسترس نیست",
  INVITE_EXPIRED: "این دعوت منقضی شده است",
  INVITE_INVALID: "این دعوت نامعتبر یا استفاده‌شده است",
  TELEGRAM_NOT_CONFIGURED: "تلگرام روی سرور پیکربندی نشده است",
  RATE_LIMITED: "درخواست‌های زیاد — کمی بعد دوباره تلاش کنید",
} as const;
