/** Stage 3 stub — provider-independent gateway (ADR-006). App must work with AI off. */

export type AiGateway = {
  isEnabled(): boolean;
};

export function createAiGateway(env: { AI_ENABLED?: string } = process.env): AiGateway {
  return {
    isEnabled() {
      return env.AI_ENABLED === "true";
    },
  };
}
