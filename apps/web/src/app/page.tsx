import { redirect } from "next/navigation";
import { DEFAULT_APP_PATH } from "@pfmp/ui";

export default function HomePage() {
  redirect(DEFAULT_APP_PATH);
}
