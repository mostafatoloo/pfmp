import { createAuthClient } from "better-auth/react";
import { magicLinkClient } from "better-auth/client/plugins";
import { passkeyClient } from "@better-auth/passkey/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type BrowserAuthClient = any;

export function createBrowserAuthClient(baseURL?: string): BrowserAuthClient {
  return createAuthClient({
    baseURL: baseURL ?? (typeof window !== "undefined" ? window.location.origin : undefined),
    plugins: [magicLinkClient(), passkeyClient()],
  });
}
