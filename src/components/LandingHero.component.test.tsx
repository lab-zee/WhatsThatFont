import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LandingHero } from "./LandingHero";

describe("LandingHero", () => {
  it("renders an accessible headline", () => {
    render(<LandingHero />);
    expect(
      screen.getByRole("heading", { name: /what'?s that font/i, level: 1 }),
    ).toBeInTheDocument();
  });

  it("is wrapped in a labelled region", () => {
    render(<LandingHero />);
    expect(screen.getByRole("region", { name: /what'?s that font/i })).toBeInTheDocument();
  });
});
