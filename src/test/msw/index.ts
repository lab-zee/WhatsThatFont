import { setupServer } from "msw/node";
import { anthropicHandlers, resetAnthropicMock } from "./anthropic";
import { googleFontsHandlers } from "./google-fonts";
import { upstashHandlers, resetUpstashMock } from "./upstash";

export const server = setupServer(...anthropicHandlers, ...googleFontsHandlers, ...upstashHandlers);

export function resetAllMocks(): void {
  resetAnthropicMock();
  resetUpstashMock();
}

export * from "./anthropic";
export * from "./google-fonts";
export * from "./upstash";
