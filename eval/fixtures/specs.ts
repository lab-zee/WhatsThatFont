/**
 * Starter eval fixtures. Each spec describes a specimen we render to a PNG via
 * Playwright. Because we control the rendering, the ground-truth label is exact.
 *
 * These specimens are deliberately varied in category (sans, serif, display, script,
 * mono, multi-font) but kept simple — they are a starting point, not a full eval set.
 * Add real-world reference images as complementary cases in manifest.json.
 *
 * All fonts listed here must appear in src/lib/fonts/google-families.json.
 */
export type SpecimenSpec = {
  id: string;
  category:
    | "sans-headline"
    | "serif-headline"
    | "display-headline"
    | "script-headline"
    | "mono-block"
    | "multi-font-editorial"
    | "multi-font-branding";
  /** Page background color. */
  background?: string;
  /** Text blocks rendered top-to-bottom. Order = reading order. */
  blocks: Array<{
    /** Stable label used in manifest (e.g. "headline", "body", "caption"). */
    region: string;
    family: string;
    weight: number;
    italic?: boolean;
    text: string;
    /** CSS font-size in px. */
    sizePx: number;
    /** CSS color. Defaults to #111. */
    color?: string;
    /** Optional tracking / letter-spacing in em. */
    letterSpacingEm?: number;
    /** Uppercase the text. */
    uppercase?: boolean;
  }>;
};

export const SPECIMENS: SpecimenSpec[] = [
  {
    id: "sans-inter-headline",
    category: "sans-headline",
    blocks: [
      {
        region: "headline",
        family: "Inter",
        weight: 700,
        sizePx: 96,
        text: "The quick brown fox",
      },
    ],
  },
  {
    id: "serif-playfair-display-headline",
    category: "serif-headline",
    blocks: [
      {
        region: "headline",
        family: "Playfair Display",
        weight: 700,
        sizePx: 96,
        text: "Elegant by design",
      },
    ],
  },
  {
    id: "display-bebas-neue",
    category: "display-headline",
    background: "#fafafa",
    blocks: [
      {
        region: "headline",
        family: "Bebas Neue",
        weight: 400,
        sizePx: 128,
        text: "DISPLAY TYPE",
        letterSpacingEm: 0.02,
      },
    ],
  },
  {
    id: "display-oswald",
    category: "display-headline",
    blocks: [
      {
        region: "headline",
        family: "Oswald",
        weight: 600,
        sizePx: 112,
        text: "NEWS BULLETIN",
        uppercase: true,
      },
    ],
  },
  {
    id: "script-caveat",
    category: "script-headline",
    blocks: [
      {
        region: "headline",
        family: "Caveat",
        weight: 700,
        sizePx: 120,
        text: "Hand drawn feel",
      },
    ],
  },
  {
    id: "mono-jetbrains",
    category: "mono-block",
    background: "#0b0b0b",
    blocks: [
      {
        region: "body",
        family: "JetBrains Mono",
        weight: 500,
        sizePx: 32,
        color: "#d1d5db",
        text: "function greet(name: string) {\n  return `Hello, ${name}!`;\n}",
      },
    ],
  },
  {
    id: "serif-eb-garamond-body",
    category: "serif-headline",
    blocks: [
      {
        region: "headline",
        family: "EB Garamond",
        weight: 500,
        italic: true,
        sizePx: 72,
        text: "On the Origin of Species",
      },
      {
        region: "body",
        family: "EB Garamond",
        weight: 400,
        sizePx: 22,
        text: "When on board H.M.S. Beagle, as naturalist, I was much struck with certain facts in the distribution of the inhabitants of South America.",
      },
    ],
  },
  {
    id: "multi-playfair-inter-editorial",
    category: "multi-font-editorial",
    blocks: [
      {
        region: "headline",
        family: "Playfair Display",
        weight: 700,
        sizePx: 88,
        text: "A Field Guide to Typography",
      },
      {
        region: "body",
        family: "Inter",
        weight: 400,
        sizePx: 20,
        color: "#404040",
        text: "Typefaces have personalities. A humanist sans feels different from a geometric sans; a transitional serif reads differently from a didone. Learning to see the difference is the first step.",
      },
    ],
  },
  {
    id: "multi-dm-serif-outfit-branding",
    category: "multi-font-branding",
    background: "#f5f1eb",
    blocks: [
      {
        region: "headline",
        family: "DM Serif Display",
        weight: 400,
        sizePx: 108,
        text: "Fern & Field",
      },
      {
        region: "subheadline",
        family: "Outfit",
        weight: 500,
        sizePx: 24,
        color: "#525252",
        letterSpacingEm: 0.08,
        uppercase: true,
        text: "Small-batch botanicals",
      },
    ],
  },
  {
    id: "sans-montserrat-hero",
    category: "sans-headline",
    blocks: [
      {
        region: "headline",
        family: "Montserrat",
        weight: 800,
        sizePx: 104,
        text: "Move fast. Break fonts.",
        letterSpacingEm: -0.02,
      },
    ],
  },
];
