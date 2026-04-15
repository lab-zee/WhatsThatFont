# UX Flow

Single-page app. No routing in v1.

## States

```
IDLE  ─(drop/select image)→  PREVIEW
PREVIEW  ─(click Identify)→  ANALYZING  ─(success)→ RESULTS
                                         └(error)→  ERROR
RESULTS  ─(drop new image)→  PREVIEW
ERROR    ─(retry / drop new)→ PREVIEW
```

### IDLE

- Full-bleed drop zone with headline: "What's that font?"
- Subhead: "Drop an image. Get the fonts. Download them."
- Below the fold: 3-step explainer + link to GitHub repo.

### PREVIEW

- Image rendered at max 60 vh.
- Primary CTA: **Identify fonts**.
- Secondary: **Choose different image**.
- Optional hint input: "Anything specific to focus on? (optional)"

### ANALYZING

- Same layout as PREVIEW with an overlay.
- Progress copy cycles: "Reading the image…" → "Analyzing letterforms…" → "Matching against the catalog…"
- Cancel button is present but treated as best-effort (the model call can't truly be aborted once dispatched).
- Hard timeout at 45 s; after that, auto-transition to ERROR with `model_timeout` copy.

### RESULTS

Two-pane layout on desktop; stacked on mobile.

- **Left**: original image with overlay rectangles drawn from each region's `bbox`. Hovering a card on the right highlights its box.
- **Right**: one collapsible card per region:
  - Region description + sample text.
  - Top candidate surfaced prominently: name, confidence badge, rationale.
  - **Use on web** button → opens a modal with copyable `<link>`, `@import`, and `font-family` snippets. Disabled (with tooltip) if no Google Fonts match.
  - **Download for desktop** button → dropdown of legitimate sources with license labels.
  - "Show 2 more candidates" expander for ranks 2–3.
  - "Not quite right?" link → opens the lookup search for manual refinement.

### ERROR

- Clear copy per error code (not raw JSON).
- `rate_limited` shows countdown until reset.
- `invalid_image` / `image_too_large` offer to re-upload.
- `model_error` / `model_timeout` offer a retry button.

## Accessibility

- Drop zone is also a `<label>` wrapping a hidden `<input type="file">` so keyboard + screen reader flows work.
- Confidence is never signaled by color alone (badges have text).
- All icon-only buttons have `aria-label`.
- Focus is moved to the results region on successful analysis.

## Visual

- System font stack for the UI chrome. We're an app about fonts; we should not pick a "personality" font that distracts from the results. Results cards do render the detected font (via Google Fonts embed) inside a preview tile — this is the one place typography is expressive.
