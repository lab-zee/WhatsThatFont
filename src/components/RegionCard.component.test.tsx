import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RegionCard } from "./RegionCard";
import type { IdentifyRegion } from "@/lib/api/identify-types";

function makeRegion(overrides: Partial<IdentifyRegion> = {}): IdentifyRegion {
  return {
    id: "r1",
    description: "Headline",
    sampleText: "HELLO",
    bbox: { x: 0, y: 0, w: 1, h: 0.2 },
    candidates: [
      {
        name: "Inter",
        confidence: "high",
        rationale: "Geometric sans; double-story g; high x-height.",
        alternateFor: null,
        verified: true,
        sources: {
          googleFont: {
            family: "Inter",
            embedUrl: "https://fonts.googleapis.com/css2?family=Inter&display=swap",
            cssFamily: "'Inter', sans-serif",
          },
          desktopDownloads: [
            {
              label: "Google Fonts",
              url: "https://fonts.google.com/specimen/Inter",
              license: "ofl",
            },
          ],
        },
      },
    ],
    ...overrides,
  };
}

describe("RegionCard", () => {
  it("shows the region description, sample text, and top candidate", () => {
    render(<RegionCard region={makeRegion()} />);
    expect(screen.getByText("Headline")).toBeInTheDocument();
    expect(screen.getByText(/HELLO/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 4, name: "Inter" })).toBeInTheDocument();
  });

  it("renders the confidence as text, not just color", () => {
    render(<RegionCard region={makeRegion()} />);
    expect(screen.getByLabelText(/high confidence/i)).toHaveTextContent(/high/i);
  });

  it("renders a 'Use on web' link when a Google Fonts match exists", () => {
    render(<RegionCard region={makeRegion()} />);
    const link = screen.getByRole("link", { name: /use on web/i });
    expect(link).toHaveAttribute("href", expect.stringContaining("fonts.googleapis.com"));
  });

  it("disables the 'Use on web' button when no Google Fonts match", () => {
    const region = makeRegion();
    region.candidates[0]!.sources.googleFont = null;
    render(<RegionCard region={region} />);
    const btn = screen.getByRole("button", { name: /use on web/i });
    expect(btn).toBeDisabled();
  });

  it("renders a desktop download link", () => {
    render(<RegionCard region={makeRegion()} />);
    expect(screen.getByRole("link", { name: /google fonts/i })).toBeInTheDocument();
  });

  it("marks unverified matches visibly", () => {
    const region = makeRegion();
    region.candidates[0]!.verified = false;
    render(<RegionCard region={region} />);
    expect(screen.getByText(/unverified match/i)).toBeInTheDocument();
  });

  it("expands alternates on click when multiple candidates exist", async () => {
    const region = makeRegion();
    region.candidates.push({
      ...region.candidates[0]!,
      name: "Work Sans",
      confidence: "medium",
    });

    render(<RegionCard region={region} />);
    const toggle = screen.getByRole("button", { name: /show 1 more candidate/i });
    await userEvent.click(toggle);
    expect(screen.getByRole("heading", { level: 4, name: "Work Sans" })).toBeInTheDocument();
  });
});
