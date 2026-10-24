import { redirect } from "next/navigation";

/** AI assistant UI removed — APIs under /api/v1/assistant remain available. */
export default function AssistantPage() {
  redirect("/today");
}
