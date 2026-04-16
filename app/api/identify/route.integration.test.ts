import { describe, it, expect, beforeEach } from "vitest";
import "@/test/msw";
import { mockFontResponse, mockSchemaViolation, mockModelError } from "@/test/msw/anthropic";
import { tinyJpeg } from "@/test/fixtures/images";
import { POST } from "./route";

function buildRequest(body: FormData): Request {
  return new Request("http://localhost/api/identify", { method: "POST", body });
}

function imageForm(
  bytes: Uint8Array,
  opts: { filename?: string; hint?: string; mime?: string } = {},
): FormData {
  const form = new FormData();
  form.set(
    "image",
    new Blob([bytes as BlobPart], { type: opts.mime ?? "image/jpeg" }),
    opts.filename ?? "ref.jpg",
  );
  if (opts.hint) form.set("hint", opts.hint);
  return form;
}

describe("POST /api/identify", () => {
  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = "sk-test";
    process.env.WTF_MODEL = "opus";
  });

  it("returns 200 with the expected response shape on the happy path", async () => {
    mockFontResponse([
      {
        sampleText: "HELLO",
        candidates: [
          {
            name: "Inter",
            confidence: "high",
            rationale: "geometric sans; high x-height",
          },
        ],
      },
    ]);

    const res = await POST(buildRequest(imageForm(tinyJpeg)));
    expect(res.status).toBe(200);

    const body = (await res.json()) as {
      regions: Array<{
        id: string;
        candidates: Array<{
          verified: boolean;
          sources: {
            googleFont: { family: string } | null;
            desktopDownloads: Array<{ license: string }>;
          };
        }>;
      }>;
      meta: { modelId: string; requestId: string; latencyMs: number };
    };

    expect(body.regions).toHaveLength(1);
    expect(body.regions[0]!.candidates[0]!.verified).toBe(true);
    expect(body.regions[0]!.candidates[0]!.sources.googleFont?.family).toBe("Inter");
    expect(body.regions[0]!.candidates[0]!.sources.desktopDownloads[0]!.license).toBe("ofl");
    expect(body.meta.modelId).toBe("claude-opus-4-6");
    expect(body.meta.requestId).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("rejects images over 10 MB with 413 image_too_large", async () => {
    const big = new Uint8Array(11 * 1024 * 1024);
    big.set(tinyJpeg);
    const res = await POST(buildRequest(imageForm(big)));
    expect(res.status).toBe(413);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("image_too_large");
  });

  it("rejects unsupported media (e.g. text) with 415 unsupported_media", async () => {
    const textBytes = new TextEncoder().encode("this is clearly not a jpeg at all ok");
    const res = await POST(buildRequest(imageForm(textBytes, { mime: "text/plain" })));
    expect(res.status).toBe(415);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("unsupported_media");
  });

  it("rejects a missing image field with 400 invalid_image", async () => {
    const form = new FormData();
    const res = await POST(buildRequest(form));
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("invalid_image");
  });

  it("returns 502 model_error when the model call fails", async () => {
    mockModelError(500);
    const res = await POST(buildRequest(imageForm(tinyJpeg)));
    expect(res.status).toBe(502);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("model_error");
  });

  it("returns 502 model_error when schema violations exceed the retry budget", async () => {
    mockSchemaViolation();
    mockSchemaViolation();
    const res = await POST(buildRequest(imageForm(tinyJpeg)));
    expect(res.status).toBe(502);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("model_error");
  });

  it("recovers from one schema violation via the single-retry path", async () => {
    mockSchemaViolation();
    mockFontResponse([
      {
        sampleText: "HELLO",
        candidates: [{ name: "Inter", confidence: "medium" }],
      },
    ]);
    const res = await POST(buildRequest(imageForm(tinyJpeg)));
    expect(res.status).toBe(200);
  });

  it("caps overly long hints at 200 chars (accepts but truncates)", async () => {
    mockFontResponse([
      {
        sampleText: "HELLO",
        candidates: [{ name: "Inter", confidence: "low" }],
      },
    ]);
    const res = await POST(buildRequest(imageForm(tinyJpeg, { hint: "x".repeat(500) })));
    expect(res.status).toBe(200);
  });
});
