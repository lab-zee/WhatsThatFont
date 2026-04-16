# ADR-0005: Font Acquisition Strategy

- **Status**: Accepted
- **Date**: 2026-04-15

## Context

Identifying the font is only half of the product promise — the user wants to _use_ it. Fonts live across wildly different distribution models:

- **Open-license** (SIL Open Font License, Apache): Google Fonts. Free, redistributable, easy CDN embed.
- **OS-bundled**: macOS ships Bodoni 72, SF Pro, Helvetica, etc. Windows ships Segoe UI, Calibri. Not redistributable but legitimately usable on the owning OS.
- **Free-for-personal-use**: DaFont, FontSpace. Legitimacy varies. Some listings are knockoffs of commercial fonts.
- **Commercial**: Monotype (Helvetica Now, Univers), Adobe Fonts (Proxima Nova), independent foundries. Must be licensed.

Questions we must answer:

1. Do we host font binaries?
2. How do we distinguish legitimate sources from knockoffs?
3. How do we handle commercial fonts — hide them, or surface them with a clear "you must license this" label?

## Decision

### 1. We do not host fonts.

We only emit links. This keeps us clear of redistribution licensing and keeps the repo lean.

### 2. Two-tier verification.

- **Google Fonts catalog**: fetched at build/runtime from the official Google Fonts API and cached for 24 h. Any font whose name exactly matches a Google Fonts family is considered web-usable, and we emit the embed snippet directly.
- **Curated non-Google catalog**: a hand-maintained JSON file (`src/lib/fonts/catalog.json`) of ~400 well-known fonts with their legitimate source URLs and licenses (`proprietary`, `bundled-macos`, `bundled-windows`, `bundled-adobe-fonts`, `ofl-mirror`). Entries are reviewed by PR; no automated scraping.
- Anything else → `verified: false` in the API response, with a single fallback link to a search URL (MyFonts search by name). The UI labels it "unverified — search for 'X'".

### 3. Commercial fonts are surfaced honestly.

- Show the font with its legitimate purchase link.
- Mark `license: "proprietary"` in the API, which the UI renders as a "License required" badge.
- If the font is OS-bundled, we link to the OS support page confirming availability rather than a shady download site.
- We never link to torrents, font-piracy aggregators, or DaFont pages that are obvious knockoffs of commercial releases. The curated catalog is the allowlist; DaFont/etc. are **not** used as a general fallback.

### 4. "Use on web" is only offered when a Google Fonts match exists.

If the identified font is not on Google Fonts, the web-embed button is disabled with a tooltip explaining why. We do not synthesize a fake `@font-face` pointing at a third-party CDN.

## Alternatives considered

### A. Proxy to unofficial CDNs (e.g. Fontshare, bunny.net, cdnfonts)

Some of these are legitimate (Fontshare is Indian Type Foundry's own CDN). Most "cdnfonts"-type sites rehost fonts without clear rights. Rejected as a general strategy — specific legitimate CDNs can be added to the curated catalog by PR.

### B. Automatic catalog from scraping

Fragile, opens us up to mis-attribution. The curated catalog is maintenance work but it's the safer floor.

### C. Hide commercial fonts from results entirely

Worse UX. The user wants to know what font it is even if they can't legally get it free. Surfacing with a clear license label is more respectful of their intelligence.

## Consequences

- **Pro**: No redistribution liability. No broken links to pirated ZIPs.
- **Pro**: Clear licensing signal in the UI teaches users what they're dealing with.
- **Con**: Curated catalog is ongoing work. We document the PR process in `CONTRIBUTING.md` so community additions are welcome.
- **Con**: Some perfectly legitimate free fonts not on Google Fonts will land as `verified: false` until added to the catalog. Acceptable; the fallback search link is still useful.
