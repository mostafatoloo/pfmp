import sql from "mssql";
import { authLogger } from "./logger";

const SEND_URL = "https://sms.3300.ir/api/wsSend.ashx";

export type NeginCreds = { userName: string; password: string; line: string };

/** Iranian mobile → 09xxxxxxxxx (Negin / DotisAcc style). */
export function normalizeMobile(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  let digits = raw.replace(/[^\d]/g, "");
  if (digits.startsWith("0098")) digits = `0${digits.slice(4)}`;
  else if (digits.startsWith("98") && digits.length === 12) digits = `0${digits.slice(2)}`;
  else if (digits.startsWith("9") && digits.length === 10) digits = `0${digits}`;
  if (!/^09\d{9}$/.test(digits)) return null;
  return digits;
}

function parseSqlServerUrl(url: string) {
  const trimmed = url.trim().replace(/^"|"$/g, "");
  if (!trimmed.startsWith("sqlserver://")) {
    throw new Error("DOTISACC_DATABASE_URL must start with sqlserver://");
  }
  const withoutScheme = trimmed.slice("sqlserver://".length);
  const [hostPart, ...paramParts] = withoutScheme.split(";");
  const params = new Map<string, string>();
  for (const part of paramParts) {
    if (!part) continue;
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    params.set(part.slice(0, eq).trim().toLowerCase(), part.slice(eq + 1).trim());
  }
  const [server, portRaw] = (hostPart ?? "localhost").split(":");
  return {
    server: server || "localhost",
    port: Number(portRaw ?? params.get("port") ?? "1433"),
    database: params.get("database") ?? "DotisAcc",
    user: params.get("user") ?? params.get("uid") ?? "sa",
    password: params.get("password") ?? params.get("pwd") ?? "",
    options: {
      encrypt: (params.get("encrypt") ?? "true").toLowerCase() !== "false",
      trustServerCertificate:
        (params.get("trustservercertificate") ?? "false").toLowerCase() === "true",
    },
  };
}

let cachedCreds: NeginCreds | null | undefined;

/** Load NeginUserName / NeginPass / NeginLine from DotisAcc.Acc_System (or env override). */
export async function loadNeginCredentials(): Promise<NeginCreds | null> {
  const fromEnvUser = process.env.NEGIN_USERNAME?.trim();
  const fromEnvPass = process.env.NEGIN_PASSWORD;
  if (fromEnvUser && fromEnvPass) {
    return {
      userName: fromEnvUser,
      password: fromEnvPass,
      line: process.env.NEGIN_LINE?.trim() ?? "",
    };
  }
  if (cachedCreds !== undefined) return cachedCreds;

  const url = process.env.DOTISACC_DATABASE_URL;
  if (!url) {
    authLogger.error("Negin SMS: set DOTISACC_DATABASE_URL or NEGIN_USERNAME/NEGIN_PASSWORD");
    cachedCreds = null;
    return null;
  }

  const cfg = parseSqlServerUrl(url);
  const pool = await sql.connect({
    server: cfg.server,
    port: cfg.port,
    user: cfg.user,
    password: cfg.password,
    database: cfg.database,
    options: cfg.options,
    connectionTimeout: 15_000,
    requestTimeout: 15_000,
  });
  try {
    const result = await pool.request().query(`
      SELECT TOP 1
        ISNULL(NeginUserName, N'') AS NeginUserName,
        ISNULL(NeginPass, N'') AS NeginPass,
        ISNULL(NeginLine, N'') AS NeginLine
      FROM dbo.Acc_System
      WHERE ISNULL(NeginUserName, N'') <> N''
        AND ISNULL(NeginPass, N'') <> N''
      ORDER BY Id`);
    const row = result.recordset[0] as
      | { NeginUserName: string; NeginPass: string; NeginLine: string }
      | undefined;
    if (!row?.NeginUserName) {
      cachedCreds = null;
      return null;
    }
    cachedCreds = {
      userName: String(row.NeginUserName).trim(),
      password: String(row.NeginPass),
      line: String(row.NeginLine ?? "").trim(),
    };
    return cachedCreds;
  } finally {
    await pool.close();
  }
}

/** Send plain SMS via Negin 3300.ir — never put URLs in the body (panel rejects them). */
export async function sendNeginSms(mobile: string, message: string): Promise<{ ok: boolean; msg: string }> {
  const normalized = normalizeMobile(mobile);
  if (!normalized) return { ok: false, msg: "شماره موبایل معتبر نیست" };

  const creds = await loadNeginCredentials();
  if (!creds) return { ok: false, msg: "پنل پیامک داتیس تنظیم نشده است" };

  const payload: Record<string, string | number> = {
    username: creds.userName,
    password: creds.password,
    mobile: normalized,
    message,
    type: 0,
  };
  if (creds.line) payload.line = creds.line;

  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await fetch(SEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const content = await response.text();
    if (response.status === 401) return { ok: false, msg: "تنظیمات پنل پیامک نامعتبر است" };
    if (response.status === 409 && attempt === 0) {
      await new Promise((r) => setTimeout(r, 1100));
      continue;
    }
    if (!response.ok) {
      authLogger.error("Negin SMS HTTP error", { status: response.status, mobile: normalized });
      return { ok: false, msg: "ارسال پیامک ناموفق بود" };
    }

    let root: Record<string, unknown> = {};
    try {
      root = JSON.parse(content || "{}") as Record<string, unknown>;
    } catch {
      return { ok: false, msg: "پاسخ پنل پیامک نامعتبر است" };
    }
    if ("relogin" in root) return { ok: false, msg: "تنظیمات پنل پیامک نامعتبر است" };

    const status = typeof root.status === "number" ? root.status : Number(root.status ?? 0);
    if (status !== -1) {
      const msg = typeof root.msg === "string" ? root.msg : "ارسال پیامک پذیرفته نشد";
      authLogger.error("Negin SMS rejected", { status, msg, mobile: normalized });
      return { ok: false, msg };
    }

    const data = root.data as { message_id?: number | string } | undefined;
    const messageId = Number(data?.message_id ?? -1);
    if (!(messageId > 1000)) {
      authLogger.error("Negin SMS not delivered", { messageId, mobile: normalized });
      return { ok: false, msg: "پیامک ارسال نشد" };
    }

    authLogger.info("Negin SMS sent", { mobile: normalized, messageId });
    return { ok: true, msg: "پیامک ارسال شد" };
  }

  return { ok: false, msg: "ارسال پیامک ناموفق بود" };
}

export function resetNeginCredCacheForTests(): void {
  cachedCreds = undefined;
}
