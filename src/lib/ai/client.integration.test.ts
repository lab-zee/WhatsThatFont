import { describe, it, expect, beforeEach } from "vitest";
import "@/test/msw";
import {
  mockFontResponse,
  mockSchemaViolation,
  mockModelError,
  getCapturedAnthropicRequests,
} from "@/test/msw/anthropic";
import { tinyJpeg } from "@/test/fixtures/images";
import { identifyFonts, MODEL_TIMEOUT_MS } from "./client";
import { ModelError } from "./errors";

const input = () => ({
  imageBytes: Buffer.from(tinyJpeg),
  mimeType: "image/jpeg" as const,
});

describe("client constants", () => {
  it("pins the model timeout to 45 seconds per api-spec", () => {
    expect(MODEL_TIMEOUT_MS).toBe(45_000);
  });
});

describe("identifyFonts", () => {
  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    process.env.WTF_MODEL = "opus";
  });

  it("returns a validated ReportFonts payload on the happy path", async () => {
    mockFontResponse([
      {
        sampleText: "HEADLINE",
        candidates: [
          {
            name: "Inter",
            confidence: "high",
            rationale: "geometric sans; double-story g",
          },
        ],
      },
    ]);

    const out = await identifyFonts(input());

    expect(out.modelId).toBe("claude-opus-4-6");
    expect(out.result.regions).toHaveLength(1);
    expect(out.result.regions[0]!.candidates[0]!.name).toBe("Inter");
    expect(typeof out.latencyMs).toBe("number");
  });

  it("retries exactly once on schema violation, then succeeds", async () => {
    mockSchemaViolation();
    mockFontResponse([
      {
        sampleText: "HEADLINE",
        candidates: [{ name: "Inter", confidence: "high" }],
      },
    ]);

    const out = await identifyFonts(input());
    expect(out.result.regions[0]!.candidates[0]!.name).toBe("Inter");
  });

  it("throws ModelError after two consecutive schema violations", async () => {
    mockSchemaViolation();
    mockSchemaViolation();
    await expect(identifyFonts(input())).rejects.toBeInstanceOf(ModelError);
  });

  it("throws ModelError when the upstream returns a 5xx", async () => {
    mockModelError(500);
    await expect(identifyFonts(input())).rejects.toBeInstanceOf(ModelError);
  });

  it("sends temperature 0, cache_control ephemeral on system, and forced tool_choice", async () => {
    mockFontResponse([
      {
        sampleText: "H",
        candidates: [{ name: "Inter", confidence: "high" }],
      },
    ]);
    await identifyFonts(input());

    const requests = getCapturedAnthropicRequests();
    expect(requests).toHaveLength(1);
    const body = requests[0] as {
      temperature: number;
      model: string;
      system: Array<{ cache_control: { type: string }; text: string }>;
      tool_choice: { type: string; name: string };
      tools: Array<{ name: string }>;
    };
    expect(body.temperature).toBe(0);
    expect(body.model).toBe("claude-opus-4-6");
    expect(body.system[0]!.cache_control.type).toBe("ephemeral");
    expect(body.tool_choice).toEqual({ type: "tool", name: "report_fonts" });
    expect(body.tools[0]!.name).toBe("report_fonts");
  });

  it("uses the sonnet model id when WTF_MODEL=sonnet", async () => {
    process.env.WTF_MODEL = "sonnet";
    mockFontResponse([
      {
        sampleText: "TEXT",
        candidates: [{ name: "Inter", confidence: "medium" }],
      },
    ]);
    const out = await identifyFonts(input());
    expect(out.modelId).toBe("claude-sonnet-4-6");
  });
});
