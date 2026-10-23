import { describe, expect, it } from "vitest";
import { createAiGateway, planProposalDraftSchema } from "./index";

describe("ai gateway", () => {
  it("is disabled by default", () => {
    expect(createAiGateway({}).isEnabled()).toBe(false);
  });

  it("stub proposes validated draft when enabled", async () => {
    const gw = createAiGateway({ AI_ENABLED: "true" });
    const draft = await gw.proposeSchedule({ workspaceId: "w1" });
    expect(planProposalDraftSchema.parse(draft).items.length).toBeGreaterThan(0);
  });

  it("throws when disabled", async () => {
    const gw = createAiGateway({ AI_ENABLED: "false" });
    await expect(gw.proposeSchedule({ workspaceId: "w1" })).rejects.toThrow("AI_UNAVAILABLE");
  });
});
