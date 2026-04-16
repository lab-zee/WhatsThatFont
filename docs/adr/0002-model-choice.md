# ADR-0002: AI Model Choice

- **Status**: Accepted
- **Date**: 2026-04-15

## Context

The single most important quality dimension of this app is font identification accuracy. The user has explicitly said they tried ChatGPT and found it unreliable. We need a vision-capable model that can:

- Read text out of images (OCR-ish, but not a separate OCR pass).
- Reason about typographic features at a glyph level.
- Follow strict output formatting so we can hand results to the UI deterministically.

## Decision

Use **Claude Opus 4.6** (`claude-opus-4-6`) as the primary model, accessed via the Anthropic SDK, with:

- **Temperature 0** for determinism.
- **System prompt marked with `cache_control: ephemeral`** for prompt caching (see [`prompt-spec.md`](../prompt-spec.md)).
- **Tool use with a single forced tool** (`report_fonts`) as the structured-output mechanism — see [ADR-0003](./0003-structured-output.md).
- **Optional fallback** to `claude-sonnet-4-6` when `WTF_MODEL=sonnet` is set, for cost-conscious self-hosters.

## Alternatives considered

### A. OpenAI GPT-4o / GPT-4.1 vision

Viable quality baseline but the user reported specifically that ChatGPT was the disappointing tool they came here to replace. Also, we're picking one vendor; Anthropic wins on the specific prompting style + tool-use ergonomics that matter for structured output.

### B. Google Gemini 2.x Pro vision

Competitive on vision tasks. Rejected for the same "one vendor" reason and to keep auth/billing simple for self-hosters.

### C. Specialist image-matching APIs (MyFonts WhatTheFont, Fontspring)

Closed APIs, commercial terms, and designed for isolated glyph crops rather than whole-reference-image analysis. We _could_ call one as a verification step, but the licensing and cost make it a bad fit for an open-source project.

### D. Local model (LLaVA / Qwen-VL / Pixtral)

Rejected for v1. Quality gap is still large on typographic tasks and self-hosters shouldn't need a GPU. Revisitable for a future "offline mode".

## Consequences

- **Pro**: Quality. Claude Opus 4.6 with a carefully engineered system prompt and tool output is currently the best-in-class option for this workload.
- **Pro**: Prompt caching materially lowers per-request cost after the first call in a 5-minute window.
- **Con**: API cost. A single Opus image call is non-trivial. The hosted version's 10-req/hour-per-IP cap is partly there for cost containment.
- **Con**: Vendor lock at the call site. Mitigated by isolating the client in `src/lib/ai/` so swapping is mechanical if we ever need to.
