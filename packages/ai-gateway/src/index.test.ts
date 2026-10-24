import { describe, expect, it } from "vitest";
import { createAiGateway, StubAiProvider } from "./index";

describe("ai gateway", () => {
  it("reports disabled when AI_ENABLED is not true", () => {
    const gw = createAiGateway({ AI_ENABLED: "false" });
    expect(gw.isEnabled()).toBe(false);
  });

  it("proposes schedule when enabled", async () => {
    const gw = createAiGateway({ AI_ENABLED: "true" }, new StubAiProvider());
    const draft = await gw.proposeSchedule({ workspaceId: "w1", promptSummary: "test" });
    expect(draft.items.length).toBeGreaterThan(0);
  });

  it("chats when enabled", async () => {
    const gw = createAiGateway({ AI_ENABLED: "true" }, new StubAiProvider());
    const reply = await gw.chat({
      message: "Summarize today",
      context: {
        openTaskCount: 2,
        overdueTasks: [{ title: "A" }],
        dueSoonTasks: [],
        note: "verified",
      },
    });
    expect(reply.reply.length).toBeGreaterThan(0);
  });
});
