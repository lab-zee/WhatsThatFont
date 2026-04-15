# Prompt Specification

Accuracy is the product. This doc pins down what we send to Claude, what we force it to return, and how we guard against hallucination.

## Model

- **Primary**: `claude-opus-4-6` (vision, 1 M context).
- **Fallback**: `claude-sonnet-4-6` when an env flag is set — cheaper for self-hosters.
- **Temperature**: 0. Typography identification should be deterministic given the same image.
- **Max tokens**: 2048. Output is structured and bounded.

## Prompt caching

The system prompt is large (~2 KB of typographic heuristics + catalog hints) and identical across requests. It is marked with `cache_control: { type: "ephemeral" }` so we pay the cache-write cost once per ~5 minutes and the cache-read cost on every subsequent request. User messages (the image) are never cached.

## System prompt (authoritative text lives in `src/lib/ai/system-prompt.ts`)

Key properties:

1. **Role framing**: "You are a senior type designer and typographic historian. Your job is to identify fonts in reference images with the precision of a professional working with clients."
2. **Anti-hallucination clause**: "If you are not confident a specific named font is present, say so. It is better to describe the category (e.g. 'geometric sans-serif in the Futura family') than to invent a name. Never fabricate foundry attributions."
3. **Multi-region discipline**: "Treat each visually distinct run of text as a separate region. Do not merge a headline and its body copy into one answer."
4. **Visual rationale requirement**: "For every candidate, cite at least two specific glyph-level features you observed (e.g. 'double-story lowercase g', 'humanist axis with slight backslant', 'squared terminals')."
5. **Known-catalog preference**: "When two fonts are equally plausible, prefer the one available on Google Fonts or widely distributed with macOS/Windows, so the user can actually obtain it."
6. **Custom lettering clause**: "If text appears to be hand-drawn or custom-lettered rather than a typeface, say so explicitly and do not guess a font name."
7. **Output contract**: "You must respond by calling the `report_fonts` tool. Do not reply with prose."

## Structured output via tool use

We define a single tool the model must call. Schema (simplified, actual Zod definition in `src/lib/ai/schema.ts`):

```ts
{
  regions: [
    {
      id: string,                       // "r1", "r2", ...
      description: string,              // natural-language locator
      sampleText: string,               // exact text read from the image
      bbox: { x: 0..1, y: 0..1, w: 0..1, h: 0..1 },
      candidates: [                     // 1..5 entries, sorted by likelihood
        {
          name: string,                 // canonical font name
          confidence: "high" | "medium" | "low",
          rationale: string,            // >= 2 glyph features observed
          alternateFor: string | null   // if this is a "close match" family member
        }
      ]
    }
  ],
  overallNotes: string | null           // optional caveats (e.g. "image is low-res")
}
```

Validated server-side with Zod. A schema violation triggers exactly one retry with the same image and a nudge message; a second failure returns `502 model_error` to the client.

## Post-processing pipeline

1. **Parse** the tool call with Zod.
2. **Normalize** font names: trim, title-case, strip "Regular"/"Book" suffixes.
3. **Verify** each name against:
   - Google Fonts API (`https://www.googleapis.com/webfonts/v1/webfonts`, cached daily).
   - Curated JSON catalog of ~400 well-known non-Google foundry fonts (Helvetica, Futura, Proxima Nova, SF Pro, Segoe UI, etc.) with their legitimate source URLs.
4. **Attach `sources`**:
   - If on Google Fonts → populate `sources.googleFont` with embed URL + CSS family.
   - If in curated catalog → populate `sources.desktopDownloads`.
   - If neither → `verified: false`, and `sources.desktopDownloads` gets a single fallback entry pointing to a search URL.
5. **Return** to client as defined in [`api-spec.md`](./api-spec.md).

## Evaluation

An `eval/` suite ships in the repo with:

- ~50 hand-labeled reference images (open-license sources only; no commercial mood boards).
- A runner that executes `/api/identify` against each and scores top-1 / top-3 accuracy.
- A baseline stored at `eval/baselines/<date>.json` so we catch regressions when the model is bumped.

CI does **not** run the eval by default (cost + flakiness). A maintainer triggers it manually before accepting a model change.
