import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth } from "@pfmp/auth";

export default async function AppSectionLayout({ children }: { children: React.ReactNode }) {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    redirect("/sign-in");
  }
  return children;
}
