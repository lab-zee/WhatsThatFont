# API Specification

All endpoints live under `/api/`. The backend is Next.js route handlers (see [ADR-0001](./adr/0001-stack-selection.md)).

## Conventions

- **Transport**: HTTPS. JSON request/response bodies except for image upload (multipart/form-data).
- **Auth**: none in v1. Rate limiting is keyed by IP.
- **Errors**: `{"error": {"code": string, "message": string}}` with an appropriate HTTP status.
- **Versioning**: unversioned in v1. If we break the contract we introduce `/api/v2/`.

## Endpoints

### `POST /api/identify`

Analyze an uploaded image and return ranked font candidates per detected text region.

**Request** — `multipart/form-data`:

| Field   | Type   | Required | Notes                                           |
|---------|--------|----------|-------------------------------------------------|
| `image` | File   | yes      | JPG, PNG, or WebP. Max 10 MB.                   |
| `hint`  | string | no       | Optional free-text hint, e.g. "focus on headline". Capped at 200 chars. |

**Response** — `200 OK`, `application/json`:

```json
{
  "regions": [
    {
      "id": "r1",
      "description": "Large serif headline at top of image",
      "sampleText": "THE QUICK BROWN FOX",
      "bbox": { "x": 0.12, "y": 0.08, "w": 0.76, "h": 0.18 },
      "candidates": [
        {
          "name": "Playfair Display",
          "confidence": "high",
          "rationale": "High-contrast didone serif with vertical stress; bracketed serifs; distinctive ball terminals on 'a' and 'c'.",
          "sources": {
            "googleFont": {
              "family": "Playfair Display",
              "embedUrl": "https://fonts.googleapis.com/css2?family=Playfair+Display&display=swap",
              "cssFamily": "'Playfair Display', serif"
            },
            "desktopDownloads": [
              { "label": "Google Fonts (free)", "url": "https://fonts.google.com/specimen/Playfair+Display", "license": "OFL" }
            ]
          },
          "verified": true
        },
        {
          "name": "Bodoni 72",
          "confidence": "medium",
          "rationale": "Similar didone skeleton but thicker hairlines than the image suggests.",
          "sources": {
            "googleFont": null,
            "desktopDownloads": [
              { "label": "Bundled with macOS", "url": "https://support.apple.com/en-us/HT201724", "license": "proprietary" }
            ]
          },
          "verified": true
        }
      ]
    }
  ],
  "meta": {
    "modelId": "claude-opus-4-6",
    "latencyMs": 6420,
    "requestId": "7f3c...e1"
  }
}
```

- `bbox` values are normalized to `[0, 1]` relative to the original image.
- `confidence` is one of `high | medium | low`.
- `verified: true` means the font name was found in our catalog (Google Fonts + curated foundries list). `verified: false` means it's a model suggestion we couldn't cross-check — still surfaced, but visually marked.
- `sources.googleFont` is `null` if the font is not on Google Fonts.
- `sources.desktopDownloads` is always a non-empty array; if nothing legitimate is found, it contains one entry pointing at a search URL (e.g. MyFonts search) with `license: "search"`.

**Errors**:

| Status | `code`              | When                                        |
|--------|---------------------|---------------------------------------------|
| 400    | `invalid_image`     | Wrong MIME, corrupted, or 0-byte payload.   |
| 413    | `image_too_large`   | > 10 MB.                                    |
| 415    | `unsupported_media` | Not JPG/PNG/WebP.                           |
| 429    | `rate_limited`      | Per-IP limit exhausted. `Retry-After` set.  |
| 502    | `model_error`       | Upstream Anthropic API failed.              |
| 504    | `model_timeout`     | Model call exceeded 45 s.                   |

### `GET /api/health`

Liveness probe. Returns `{"ok": true, "version": "<git sha>"}`.

### `GET /api/fonts/lookup?q=<name>`

Resolve a free-text font name to known catalog entries. Used by the "Not quite right?" affordance. Returns the same `sources` shape as above. Rate-limited separately at 60 req/min/IP.

## Rate limiting headers

On every rate-limited endpoint, responses include:

- `X-RateLimit-Limit`: the window cap.
- `X-RateLimit-Remaining`: requests left in the current window.
- `X-RateLimit-Reset`: unix seconds when the window resets.
- `Retry-After` (on 429 only).

## Streaming (v1.1, not v1)

`/api/identify` is a single JSON response in v1. Streaming partial results via SSE is tracked for v1.1 but explicitly deferred to keep the first cut simple.
