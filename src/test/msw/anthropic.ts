import { http, HttpResponse } from "msw";

export type MockFontCandidate = {
  name: string;
  confidence: "high" | "medium" | "low";
  rationale?: string;
};

export type MockRegion = {
  sampleText: string;
  candidates: MockFontCandidate[];
};

let nextResponder: ((body: unknown) => Response) | null = null;

export function mockFontResponse(regions: MockRegion[]): void {
  nextResponder = () =>
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
              description: `region ${i + 1}`,
              sampleText: r.sampleText,
              bbox: { x: 0, y: 0, w: 1, h: 1 },
              candidates: r.candidates.map((c) => ({
                name: c.name,
                confidence: c.confidence,
                rationale: c.rationale ?? "glyph feature A; glyph feature B",
                alternateFor: null,
              })),
            })),
            overallNotes: null,
          },
        },
      ],
      stop_reason: "tool_use",
    });
}

export function mockModelError(status = 500): void {
  nextResponder = () => HttpResponse.json({ error: "mocked" }, { status });
}

export function resetAnthropicMock(): void {
  nextResponder = null;
}

export const anthropicHandlers = [
  http.post("https://api.anthropic.com/v1/messages", async ({ request }) => {
    if (!nextResponder) {
      return HttpResponse.json(
        { error: "No Anthropic mock configured. Call mockFontResponse() in your test." },
        { status: 599 },
      );
    }
    const body = await request.json().catch(() => ({}));
    return nextResponder(body);
  }),
];
