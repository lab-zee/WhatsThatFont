import { http, HttpResponse, delay } from "msw";

export type MockFontCandidate = {
  name: string;
  confidence: "high" | "medium" | "low";
  rationale?: string;
  alternateFor?: string | null;
};

export type MockRegion = {
  sampleText: string;
  description?: string;
  bbox?: { x: number; y: number; w: number; h: number };
  candidates: MockFontCandidate[];
};

type Responder = () => Promise<Response> | Response;

const queue: Responder[] = [];
const capturedRequests: unknown[] = [];

export function getCapturedAnthropicRequests(): unknown[] {
  return capturedRequests.slice();
}

export function queueAnthropicResponse(r: Responder): void {
  queue.push(r);
}

export function mockFontResponse(regions: MockRegion[]): void {
  queueAnthropicResponse(() =>
    HttpResponse.json({
      id: "msg_test",
      type: "message",
      role: "assistant",
      model: "claude-opus-4-6",
      content: [
        {
          type: "tool_use",
          id: "toolu_test",
          name: "report_fonts",
          input: {
            regions: regions.map((r, i) => ({
              id: `r${i + 1}`,
              description: r.description ?? `region ${i + 1}`,
              sampleText: r.sampleText,
              bbox: r.bbox ?? { x: 0, y: 0, w: 1, h: 1 },
              candidates: r.candidates.map((c) => ({
                name: c.name,
                confidence: c.confidence,
                rationale: c.rationale ?? "glyph feature A; glyph feature B",
                alternateFor: c.alternateFor ?? null,
              })),
            })),
            overallNotes: null,
          },
        },
      ],
      stop_reason: "tool_use",
    }),
  );
}

export function mockSchemaViolation(): void {
  queueAnthropicResponse(() =>
    HttpResponse.json({
      id: "msg_test",
      type: "message",
      role: "assistant",
      model: "claude-opus-4-6",
      content: [
        {
          type: "tool_use",
          id: "toolu_bad",
          name: "report_fonts",
          input: { regions: "not-an-array", overallNotes: null },
        },
      ],
      stop_reason: "tool_use",
    }),
  );
}

export function mockModelError(status = 500): void {
  queueAnthropicResponse(() =>
    HttpResponse.json(
      { type: "error", error: { type: "api_error", message: "mocked failure" } },
      { status },
    ),
  );
}

export function mockAnthropicDelay(ms: number): void {
  queueAnthropicResponse(async () => {
    await delay(ms);
    return HttpResponse.json({ type: "error", error: { message: "should have timed out" } });
  });
}

export function resetAnthropicMock(): void {
  queue.length = 0;
  capturedRequests.length = 0;
}

export const anthropicHandlers = [
  http.post("https://api.anthropic.com/v1/messages", async ({ request }) => {
    try {
      capturedRequests.push(await request.clone().json());
    } catch {
      // non-JSON bodies aren't relevant for our assertions
    }
    const responder = queue.shift();
    if (!responder) {
      return HttpResponse.json(
        {
          type: "error",
          error: {
            type: "test_setup_error",
            message:
              "No Anthropic mock configured. Call mockFontResponse/mockSchemaViolation/mockModelError in your test.",
          },
        },
        { status: 599 },
      );
    }
    return responder();
  }),
];
