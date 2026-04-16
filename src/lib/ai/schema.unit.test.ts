import { describe, it, expect } from "vitest";
import { ReportFontsSchema, ReportFontsJsonSchema } from "./schema";

const validPayload = {
  regions: [
    {
      id: "r1",
      description: "headline",
      sampleText: "Hello",
      bbox: { x: 0.1, y: 0.1, w: 0.5, h: 0.2 },
      candidates: [
        {
          name: "Inter",
          confidence: "high" as const,
          rationale: "geometric sans-serif; double-story lowercase g",
          alternateFor: null,
        },
      ],
    },
  ],
  overallNotes: null,
};

describe("ReportFontsSchema", () => {
  it("accepts a canonical valid payload", () => {
    expect(ReportFontsSchema.safeParse(validPayload).success).toBe(true);
  });

  it("rejects a missing regions array", () => {
    const { regions: _regions, ...rest } = validPayload;
    void _regions;
    expect(ReportFontsSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects an empty regions array", () => {
    expect(ReportFontsSchema.safeParse({ ...validPayload, regions: [] }).success).toBe(false);
  });

  it("rejects an invalid confidence enum value", () => {
    const bad = structuredClone(validPayload);
    (bad.regions[0]!.candidates[0] as { confidence: string }).confidence = "very high";
    expect(ReportFontsSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects bbox values outside [0, 1]", () => {
    const bad = structuredClone(validPayload);
    bad.regions[0]!.bbox.w = 1.5;
    expect(ReportFontsSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects a region with zero candidates", () => {
    const bad = structuredClone(validPayload);
    bad.regions[0]!.candidates = [];
    expect(ReportFontsSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects a region with more than 5 candidates", () => {
    const bad = structuredClone(validPayload);
    bad.regions[0]!.candidates = Array(6).fill(validPayload.regions[0]!.candidates[0]);
    expect(ReportFontsSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects region ids that are not r<digits>", () => {
    const bad = structuredClone(validPayload);
    bad.regions[0]!.id = "region-1";
    expect(ReportFontsSchema.safeParse(bad).success).toBe(false);
  });

  it("accepts alternateFor as either null or a string", () => {
    type MutablePayload = {
      regions: Array<{ candidates: Array<{ alternateFor: string | null }> }>;
    };
    const withString = structuredClone(validPayload) as unknown as MutablePayload;
    withString.regions[0]!.candidates[0]!.alternateFor = "Inter Tight";
    expect(ReportFontsSchema.safeParse(withString).success).toBe(true);

    const withNull = structuredClone(validPayload) as unknown as MutablePayload;
    withNull.regions[0]!.candidates[0]!.alternateFor = null;
    expect(ReportFontsSchema.safeParse(withNull).success).toBe(true);
  });
});

describe("ReportFontsJsonSchema", () => {
  it("exposes an object schema for Anthropic tool use", () => {
    expect(ReportFontsJsonSchema.type).toBe("object");
    expect(ReportFontsJsonSchema.properties).toHaveProperty("regions");
    expect(ReportFontsJsonSchema.properties).toHaveProperty("overallNotes");
  });
});
