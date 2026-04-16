# WhatsThatFont — Product Requirements

## 1. Problem

Designers working from reference images (screenshots, mood boards, inspiration photos) routinely need to identify which fonts were used so they can reproduce the look in their own work. Existing tools fall into two buckets:

- **Specialist tools** (WhatTheFont, Fontspring Matcherator): require isolated glyph crops; brittle with multi-font layouts, stylized text, or low-resolution sources.
- **General LLMs** (ChatGPT, Claude, Gemini): surprisingly unreliable without heavy prompting. Hallucinate font names, ignore parts of the image, or give generic answers like "a sans-serif".

Neither makes it easy to go from identification to _using_ the font.

## 2. Goals

- **G1. Accuracy is the headline feature.** A user should be able to trust the top result for a given region of text. Confidence must be honestly reported.
- **G2. End-to-end path from image → installed font.** Identification is only half the job; acquisition is the other half.
- **G3. Handle multi-font images.** Most reference images have headings, body, and accents in different faces. We must surface each distinctly.
- **G4. Free tier, abuse-resistant.** The hosted version is free within sensible per-IP limits. Self-hosters can swap limits out.
- **G5. Open source, self-hostable.** The entire app runs from a single `docker compose up` or `npm run dev`, with the user's own API key.

## 3. Non-goals (v1)

- **Custom font training** on user-uploaded glyphs.
- **Paid tiers, accounts, auth.** Single-player, stateless.
- **Font preview rendering** with custom text (nice-to-have, not v1).
- **Mobile-native apps.** Responsive web only.
- **Batch/bulk API** for enterprise. A single-image endpoint is enough for v1.

## 4. Primary user flow

1. User lands on `whatsthatfont.com`.
2. User drops or selects an image (JPG/PNG/WebP, up to 10 MB).
3. A preview appears. User clicks **Identify fonts**.
4. Backend streams a response: for each distinct text region, a ranked list of likely fonts with confidence scores and visual rationale (e.g. "geometric sans, single-story 'a', high x-height").
5. For each result the UI shows:
   - A **"Use on web"** action (Google Fonts embed snippet if available).
   - A **"Download for desktop"** action (link to Google Fonts zip, FontSquirrel, DaFont, or the foundry — whichever is legitimate).
   - A **"Not quite right?"** affordance that surfaces the 2nd/3rd ranked alternates.

## 5. Output modalities

Every identified font must be tagged with one or both of:

- **Web font**: resolvable via the Google Fonts CDN. Surface the `<link>` / `@import` / `font-family` snippet inline.
- **OS font**: downloadable and installable on macOS/Windows/Linux. Surface a direct link to a legitimate source. Never host or redistribute font binaries ourselves.

If a font is commercial-only (e.g. proprietary Adobe Fonts, Monotype), we link to the purchase page and mark it clearly.

## 6. Accuracy strategy (summary; full detail in [`prompt-spec.md`](./prompt-spec.md))

- Vision-capable LLM (Claude Opus 4.6) with a system prompt engineered for typographic analysis.
- Structured output schema enforced via tool use — the model cannot emit free-form prose as the final answer.
- Model is required to emit _visual rationale_ per suggestion, which raises accuracy and lets the user sanity-check.
- Cross-verification: every suggested font name is validated against the Google Fonts catalog and a curated list of well-known foundries. Unknown names are flagged `unverified` in the UI rather than silently dropped — a hallucinated name is still a useful hint for search.
- Confidence is reported as `high | medium | low`, not a fake percentage.

## 7. Abuse prevention

- **Per-IP rate limit**: 10 images per IP per hour on the hosted version. Configurable via env var.
- **Image size cap**: 10 MB. Rejected before reaching the model.
- **MIME sniffing**: server-side, not just extension trust.
- **No persistence**: uploaded bytes live in request memory only. See [ADR-0007](./adr/0007-no-image-persistence.md).

## 8. Success metrics

- **Primary**: user-reported "top suggestion was correct" rate > 90 % on a hand-curated eval set of 50 reference images spanning sans, serif, script, display, and multi-font layouts.
- **Secondary**: median end-to-end latency < 8 s per image.
- **Tertiary**: self-host setup time < 10 minutes from `git clone` to working local instance.

## 9. Out-of-scope risks / open questions

- **Commercial fonts**: we can identify Helvetica but can't legally link to a free download. How prominent should the "you'll need to license this" messaging be? (See [ADR-0005](./adr/0005-font-acquisition-strategy.md).)
- **Model drift**: accuracy depends on the upstream model. Eval suite must be re-run when we bump the model version.
- **Edge case: handwritten / AI-generated "fonts"**. The model should be instructed to say "this appears to be custom lettering, not a typeface" rather than guess.
