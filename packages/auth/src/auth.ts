import { betterAuth } from "better-auth";
import { magicLink } from "better-auth/plugins";
import { passkey } from "@better-auth/passkey";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { getPrisma, WorkspaceRepository } from "@pfmp/database";
import { authLogger } from "./logger";

/**
 * Passkey / WebAuthn scaffolding (ADR-001).
 * Enabled when PASSKEY_ENABLED=true. On SQL Server the Passkey table is migrated via Prisma.
 * Fallback: if WebAuthn is unavailable in the browser (or PASSKEY_ENABLED=false), users
 * continue with email magic-link only — documented in docs/architecture/auth-notes.md.
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

const magicLinkStore: { lastUrl?: string; lastEmail?: string } = {};

/** Dev/test helper — last magic link URL (never log secrets beyond the link itself in prod). */
export function getLastMagicLinkForTests(): { url?: string; email?: string } {
  return { url: magicLinkStore.lastUrl, email: magicLinkStore.lastEmail };
}

// Avoid exporting unwieldy Better Auth inferred types across package boundaries
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
      magicLink({
        expiresIn: 60 * 10,
        sendMagicLink: async ({ email, url }) => {
          magicLinkStore.lastEmail = email;
          magicLinkStore.lastUrl = url;
          if (!process.env.RESEND_API_KEY) {
            authLogger.info("magic link (dev log)", { email, url });
            return;
          }
          authLogger.info("magic link email queued", { email });
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

/** Reset singleton (tests only). */
export function resetAuthForTests(): void {
  authSingleton = undefined;
}
