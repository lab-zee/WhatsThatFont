# Accuracy Eval

Runs the real Anthropic API against a labeled set of reference images and scores the top-1 and top-3 font-identification accuracy. See [ADR-0008](../docs/adr/0008-testing-strategy.md).

**This is not part of `pnpm run ci`.** Real API calls cost money and are non-deterministic. Trigger manually before merging any prompt or model change.

## Layout

```
eval/
├── README.md                 — this file
├── run.ts                    — runner invoked by `pnpm eval`
├── manifest.json             — labeled image set (per-image ground truth)
├── images/                   — the reference images themselves (gitignored)
├── reports/<ts>.json         — per-run scored reports (gitignored)
└── baselines/<date>.json     — committed baselines; regressions block the PR
```

## Manifest format

`manifest.json` is a list of labeled cases. Each case points at an image in `images/` and lists the fonts a human labeler identified, in rank order.

```json
{
  "version": 1,
  "cases": [
    {
      "id": "tech-landing-01",
      "image": "tech-landing-01.jpg",
      "category": "sans-serif-headline",
      "labels": [
        { "region": "headline", "expected": ["Inter", "Inter Tight"] },
        { "region": "body", "expected": ["Inter"] }
      ],
      "source": "screenshot of own work (public)",
      "notes": "No commercial reference material."
    }
  ]
}
```

- `expected` is an ordered list of acceptable answers. The model wins top-1 if its first candidate for that region matches any entry. Top-3 if any of the model's first three candidates matches any entry. Match is case-insensitive after [normalizeFontName](../src/lib/fonts/normalize.ts).
- `category` groups cases for per-bucket scoring (sans, serif, display, script, multi-font, low-res, etc.).

## Supplying images

Images are **not committed** to the repo — only their labels in `manifest.json`. Two ways to populate `eval/images/`:

### Option A: generate the starter set (recommended first run)

```bash
pnpm eval:fixtures
```

This launches headless Chromium (already installed via Playwright), renders ~10 labeled specimens from [fixtures/specs.ts](./fixtures/specs.ts) — each one a single- or multi-font layout rendered in the exact Google Fonts families we're labeling — and writes them to `eval/images/*.png`. It also overwrites `manifest.json` so labels stay in sync with whatever is in `specs.ts`.

Because we control the rendering, ground truth is exact. This is the cheapest end-to-end smoke test for the identification pipeline.

### Option B: add your own hand-labeled real-world cases

Generated specimens are pristine and single-layout. Real reference images are messy — that's where accuracy usually breaks down. Append your own cases to `manifest.json` and drop the matching files into `eval/images/`.

Acceptable image sources:

- Public specimens from Google Fonts / open-license foundries.
- Screenshots of your own design work.
- Permissively-licensed photography with text on it (e.g. Unsplash with known typefaces).

Do **not** commit screenshots of commercial brand identities, client work, or copyrighted design inspiration. Keep `eval/images/` gitignored.

## Running

```bash
cp .env.example .env                            # set a real ANTHROPIC_API_KEY
pnpm eval:fixtures                              # generate the starter specimen set
pnpm eval                                       # score the whole manifest
pnpm eval -- --case sans-inter-headline         # run a single case
pnpm eval -- --baseline latest                  # compare against eval/baselines/<latest>.json
```

Cost note: the default model is Claude Opus 4.6 vision, which is ~$0.05–$0.15 per image depending on size. For the 10 starter specimens, a full run is roughly $0.50–$1.50. Set `WTF_MODEL=sonnet` in `.env` for a ~4× cheaper run at slightly lower accuracy.

## Baselines

- Committed JSON files at `eval/baselines/<YYYY-MM-DD>.json`.
- Each baseline captures top-1 and top-3 accuracy overall and per category.
- A run fails if top-1 drops by more than 2 percentage points vs. the baseline named via `--baseline`.

## When to re-run

- Changes to `src/lib/ai/system-prompt.ts` or `src/lib/ai/schema.ts`.
- Changes to `WTF_MODEL` default.
- Changes to post-processing logic in `src/app/api/identify/route.ts` that affect candidate selection.
- Before committing a new baseline.
