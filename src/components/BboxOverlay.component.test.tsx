import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { BboxOverlay } from "./BboxOverlay";
import type { IdentifyRegion } from "@/lib/api/identify-types";

function r(id: string, bbox: IdentifyRegion["bbox"]): IdentifyRegion {
  return {
    id,
    description: "d",
    sampleText: "t",
    bbox,
    candidates: [],
  };
}

describe("BboxOverlay", () => {
  it("renders one rect per region with percentage coords", () => {
    const { container } = render(
      <BboxOverlay regions={[r("r1", { x: 0.1, y: 0.2, w: 0.3, h: 0.4 })]} />,
    );
    const rect = container.querySelector('[data-region-id="r1"]') as HTMLElement | null;
    expect(rect).not.toBeNull();
    expect(rect!.style.left).toBe("10%");
    expect(rect!.style.top).toBe("20%");
    expect(rect!.style.width).toBe("30%");
    expect(rect!.style.height).toBe("40%");
  });

  it("highlights the active region with a distinct class", () => {
    const { container } = render(
      <BboxOverlay
        regions={[
          r("r1", { x: 0, y: 0, w: 0.5, h: 0.5 }),
          r("r2", { x: 0.5, y: 0.5, w: 0.5, h: 0.5 }),
        ]}
        activeRegionId="r2"
      />,
    );
    const r1 = container.querySelector('[data-region-id="r1"]');
    const r2 = container.querySelector('[data-region-id="r2"]');
    expect(r1?.className).not.toContain("emerald");
    expect(r2?.className).toContain("emerald");
  });

  it("is aria-hidden so screen readers get information from the cards", () => {
    const { container } = render(<BboxOverlay regions={[r("r1", { x: 0, y: 0, w: 1, h: 1 })]} />);
    expect(container.firstElementChild?.getAttribute("aria-hidden")).toBe("true");
  });
});
