# ADR-0007: No Image Persistence

- **Status**: Accepted
- **Date**: 2026-04-15

## Context

Users upload reference images that may include copyrighted material, client work under NDA, personal photos with text on them, or screenshots containing private information. We have no product need to retain these bytes after the response is returned.

Storing them anyway would:

- Create a privacy/compliance surface (GDPR, right-to-deletion, data-processing agreements).
- Invite takedown requests.
- Cost money for storage.
- Tempt future "features" that sound good but aren't worth the cost (image history, sharing).

## Decision

Uploaded image bytes are processed **entirely in request memory** and never written to disk, object storage, cache, or log.

Concretely:

- The multipart parser reads the file into a `Buffer`.
- The `Buffer` is base64-encoded and sent in the Anthropic API request.
- After the response is returned to the client, all references to the buffer go out of scope and are garbage-collected.
- Logs never include the image bytes, filename, or any pixel-derived data beyond non-identifying metrics (size in bytes, MIME type, dimensions).
- The Anthropic API is called with the default zero-data-retention policy our account has configured; we do not opt into model training on customer data.

## Alternatives considered

### A. Short-lived S3 bucket with 1-hour TTL

Allows features like shareable results or async retries. Rejected for v1: feature not needed, and the privacy surface it opens is disproportionate to the benefit.

### B. Temporary disk buffering for large images

Node's default multipart handlers may spill to disk past a threshold. We will configure the parser to reject above 10 MB outright rather than spill, so this doesn't happen incidentally.

## Consequences

- **Pro**: The simplest possible privacy story. "We don't keep your images" is true and easy to explain.
- **Pro**: No storage bill.
- **Con**: Users who want to iterate on the same image must re-upload it. Trivial UX cost; acceptable.
- **Con**: If we later want features like "share these results", we'll need to revisit — deliberately out of scope now.
