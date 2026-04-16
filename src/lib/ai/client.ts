import Anthropic from "@anthropic-ai/sdk";
import { env } from "@/lib/env";
import { SYSTEM_PROMPT, REPORT_FONTS_TOOL } from "./system-prompt";
import { ReportFontsSchema, type ReportFonts } from "./schema";
import { ModelError, ModelTimeoutError } from "./errors";

const MODEL_IDS = {
  opus: "claude-opus-4-6",
  sonnet: "claude-sonnet-4-6",
} as const;

export const MODEL_TIMEOUT_MS = 45_000;
const MAX_TOKENS = 2048;
const HINT_MAX_LEN = 200;

export type SupportedMimeType = "image/jpeg" | "image/png" | "image/webp";

export type IdentifyFontsInput = {
  imageBytes: Buffer;
  mimeType: SupportedMimeType;
  hint?: string | undefined;
};

export type IdentifyFontsResult = {
  result: ReportFonts;
  modelId: string;
  latencyMs: number;
};

export async function identifyFonts(input: IdentifyFontsInput): Promise<IdentifyFontsResult> {
  const { imageBytes, mimeType, hint } = input;
  const client = new Anthropic({
    apiKey: env.ANTHROPIC_API_KEY,
    maxRetries: 0,
  });
  const modelId = MODEL_IDS[env.WTF_MODEL];
  const startedAt = Date.now();

  async function callModel(corrective?: string) {
    const userContent: Anthropic.Messages.ContentBlockParam[] = [
      {
        type: "image",
        source: {
          type: "base64",
          media_type: mimeType,
          data: imageBytes.toString("base64"),
        },
      },
    ];
    if (hint) {
      userContent.push({ type: "text", text: `Hint: ${hint.slice(0, HINT_MAX_LEN)}` });
    }
    if (corrective) {
      userContent.push({ type: "text", text: corrective });
    }

    try {
      return await client.messages.create(
        {
          model: modelId,
          max_tokens: MAX_TOKENS,
          temperature: 0,
          system: [
            {
              type: "text",
              text: SYSTEM_PROMPT,
              cache_control: { type: "ephemeral" },
            },
          ],
          tools: [REPORT_FONTS_TOOL],
          tool_choice: { type: "tool", name: REPORT_FONTS_TOOL.name },
          messages: [{ role: "user", content: userContent }],
        },
        { timeout: MODEL_TIMEOUT_MS },
      );
    } catch (err) {
      if (err instanceof Anthropic.APIConnectionTimeoutError) {
        throw new ModelTimeoutError();
      }
      throw new ModelError(err instanceof Error ? err.message : "Upstream Anthropic API failed", {
        cause: err,
      });
    }
  }

  function extract(response: Anthropic.Messages.Message): ReportFonts | null {
    const block = response.content.find(
      (b): b is Anthropic.Messages.ToolUseBlock =>
        b.type === "tool_use" && b.name === REPORT_FONTS_TOOL.name,
    );
    if (!block) return null;
    const parsed = ReportFontsSchema.safeParse(block.input);
    return parsed.success ? parsed.data : null;
  }

  let response = await callModel();
  let parsed = extract(response);
  if (!parsed) {
    response = await callModel(
      "Your last response did not match the required schema. Call the report_fonts tool again with valid input.",
    );
    parsed = extract(response);
    if (!parsed) {
      throw new ModelError("Schema validation failed after retry.");
    }
  }

  return {
    result: parsed,
    modelId,
    latencyMs: Date.now() - startedAt,
  };
}
