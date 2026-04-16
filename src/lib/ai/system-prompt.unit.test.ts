import { describe, it, expect } from "vitest";
import { SYSTEM_PROMPT, REPORT_FONTS_TOOL } from "./system-prompt";

describe("SYSTEM_PROMPT", () => {
  it("frames the model as a type designer (anti-generic framing)", () => {
    expect(SYSTEM_PROMPT).toMatch(/type designer/i);
  });

  it("requires multi-region detection", () => {
    expect(SYSTEM_PROMPT).toMatch(/separate region/i);
  });

  it("requires at least two glyph-level rationale features", () => {
    expect(SYSTEM_PROMPT).toMatch(/at least two/i);
    expect(SYSTEM_PROMPT).toMatch(/glyph/i);
  });

  it("instructs the model against hallucinating font names", () => {
    expect(SYSTEM_PROMPT).toMatch(/never fabricate/i);
  });

  it("distinguishes custom lettering from typefaces", () => {
    expect(SYSTEM_PROMPT).toMatch(/hand-drawn|custom-lettered/i);
  });

  it("forces tool use over prose", () => {
    expect(SYSTEM_PROMPT).toMatch(/report_fonts/);
    expect(SYSTEM_PROMPT).toMatch(/Do not reply with prose/i);
  });
});

describe("REPORT_FONTS_TOOL", () => {
  it("is named report_fonts and carries a JSON Schema input", () => {
    expect(REPORT_FONTS_TOOL.name).toBe("report_fonts");
    expect(REPORT_FONTS_TOOL.input_schema.type).toBe("object");
    expect(REPORT_FONTS_TOOL.input_schema.properties).toHaveProperty("regions");
  });
});
