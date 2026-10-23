import { betterAuth } from "better-auth";
import { phoneNumber } from "better-auth/plugins";
import { passkey } from "@better-auth/passkey";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { APIError } from "better-auth/api";
import { getPrisma, WorkspaceRepository } from "@pfmp/database";
import { authLogger } from "./logger";
import { normalizeMobile, sendNeginSms } from "./negin-sms";

/**
 * Auth: SMS OTP (Negin via DotisAcc Acc_System) + email/phone password.
 * OTP SMS contains only a short code — never a URL (Negin/3300 rejects links).
 */
function passkeyPlugins() {
  if (process.env.PASSKEY_ENABLED === "false") {
    return [];
  }
  const rpID = process.env.PASSKEY_RP_ID ?? "localhost";
  const rpName = process.env.PASSKEY_RP_NAME ?? "PFMP";
  const origin = process.env.BETTER_AUTH_URL ?? process.env.APP_URL ?? "http://localhost:3000";
  return [
    passkey({
      rpID,
      rpName,
      origin,
    }),
  ];
}

const otpStore: { lastPhone?: string; lastCode?: string } = {};

/** Dev/test helper — last OTP when SMS is logged locally. */
export function getLastOtpForTests(): { phone?: string; code?: string } {
  return { phone: otpStore.lastPhone, code: otpStore.lastCode };
}

/** @deprecated magic link removed — kept for older test imports */
export function getLastMagicLinkForTests(): { url?: string; email?: string } {
  return {};
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Auth = any;

export function createAuth(): Auth {
  const prisma = getPrisma();
  const workspaces = new WorkspaceRepository(prisma);
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("BETTER_AUTH_SECRET must be set to at least 32 characters");
  }
  const baseURL = process.env.BETTER_AUTH_URL ?? process.env.APP_URL ?? "http://localhost:3000";

  return betterAuth({
    appName: "PFMP",
    baseURL,
    secret,
    database: prismaAdapter(prisma, { provider: "sqlserver" }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 6,
    },
    user: {
      additionalFields: {
        timezone: {
          type: "string",
          defaultValue: "UTC",
          required: false,
        },
        locale: {
          type: "string",
          defaultValue: "en",
          required: false,
        },
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 14,
      updateAge: 60 * 60 * 24,
      cookieCache: {
        enabled: true,
        maxAge: 60 * 5,
      },
    },
    rateLimit: {
      enabled: true,
      window: 60,
      max: 30,
    },
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            try {
              await workspaces.createPersonalWorkspace(user.id, `${user.name || "Personal"}`);
              authLogger.info("personal workspace created", { userId: user.id });
            } catch (err) {
              authLogger.error("failed to create personal workspace", {
                userId: user.id,
                err: err instanceof Error ? err.message : "unknown",
              });
              throw err;
            }
          },
        },
      },
      session: {
        delete: {
          after: async (session) => {
            authLogger.info("session revoked", { sessionId: session.id, userId: session.userId });
          },
        },
      },
    },
    plugins: [
      phoneNumber({
        otpLength: 6,
        expiresIn: 300,
        sendOTP: async ({ phoneNumber: phone, code }) => {
          const normalized = normalizeMobile(phone);
          if (!normalized) {
            throw new APIError("BAD_REQUEST", { message: "شماره موبایل معتبر نیست (مثال: 09123456789)" });
          }
          otpStore.lastPhone = normalized;
          otpStore.lastCode = code;
          const message = `کد ورود PFMP: ${code}\nتا ۵ دقیقه معتبر است.`;
          const result = await sendNeginSms(normalized, message);
          if (!result.ok) {
            authLogger.error("failed to send OTP SMS", { phone: normalized, msg: result.msg });
            if (process.env.NODE_ENV !== "production") {
              authLogger.info("OTP (dev log — SMS failed)", { phone: normalized, code });
              return;
            }
            throw new APIError("BAD_REQUEST", { message: result.msg });
          }
        },
        sendPasswordResetOTP: async ({ phoneNumber: phone, code }) => {
          const normalized = normalizeMobile(phone);
          if (!normalized) {
            throw new APIError("BAD_REQUEST", { message: "شماره موبایل معتبر نیست" });
          }
          otpStore.lastPhone = normalized;
          otpStore.lastCode = code;
          const message = `بازیابی رمز PFMP\nکد: ${code}\nتا ۵ دقیقه معتبر است.`;
          const result = await sendNeginSms(normalized, message);
          if (!result.ok) {
            if (process.env.NODE_ENV !== "production") {
              authLogger.info("password-reset OTP (dev log)", { phone: normalized, code });
              return;
            }
            throw new APIError("BAD_REQUEST", { message: result.msg });
          }
        },
        phoneNumberValidator: async (phone) => Boolean(normalizeMobile(phone)),
        signUpOnVerification: {
          getTempEmail: (phone) => {
            const n = normalizeMobile(phone) ?? phone.replace(/\D/g, "");
            return `${n}@phone.pfmp.local`;
          },
          getTempName: (phone) => normalizeMobile(phone) ?? phone,
        },
      }),
      ...passkeyPlugins(),
    ],
  });
}

let authSingleton: Auth | undefined;

export function getAuth(): Auth {
  if (!authSingleton) {
    authSingleton = createAuth();
  }
  return authSingleton;
}

export function resetAuthForTests(): void {
  authSingleton = undefined;
}
