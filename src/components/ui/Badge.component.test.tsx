import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ConfidenceBadge, Badge } from "./Badge";

describe("ConfidenceBadge", () => {
  it("renders a 'high' badge with an accessible label", () => {
    render(<ConfidenceBadge level="high" />);
    expect(screen.getByLabelText(/high confidence/i)).toBeInTheDocument();
  });

  it("never signals confidence by color alone (text content present)", () => {
    render(<ConfidenceBadge level="medium" />);
    expect(screen.getByLabelText(/medium/i)).toHaveTextContent(/medium/i);
  });

  it("renders a 'low' badge", () => {
    render(<ConfidenceBadge level="low" />);
    expect(screen.getByLabelText(/low confidence/i)).toBeInTheDocument();
  });
});

describe("Badge", () => {
  it("renders its children", () => {
    render(<Badge>Verified</Badge>);
    expect(screen.getByText("Verified")).toBeInTheDocument();
  });

  it("accepts a tone prop without crashing", () => {
    render(<Badge tone="warn">Unverified</Badge>);
    expect(screen.getByText("Unverified")).toBeInTheDocument();
  });
});
