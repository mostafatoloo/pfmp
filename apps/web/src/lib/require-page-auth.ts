import { AuthzError, requireWorkspace, type AuthedContext } from "@pfmp/auth";
import { redirect } from "next/navigation";

/**
 * Page/RSC auth helper — redirects to sign-in on 401 instead of throwing
 * (avoids Next.js "Application error" digests when layout and page race).
 */
export async function requirePageWorkspace(headers: Headers): Promise<AuthedContext> {
  try {
    return await requireWorkspace(headers);
  } catch (err) {
    if (err instanceof AuthzError && err.code === "UNAUTHORIZED") {
      redirect("/sign-in");
    }
    throw err;
  }
}
