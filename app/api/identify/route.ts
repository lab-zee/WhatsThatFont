import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { identifyFonts, type SupportedMimeType } from "@/lib/ai/client";
import { ModelError, ModelTimeoutError } from "@/lib/ai/errors";
import { detectImageMime, MAX_IMAGE_BYTES, SUPPORTED_MIME_TYPES } from "@/lib/validation/image";
import { resolveSources } from "@/lib/fonts/resolve";
import { getLimiter } from "@/lib/ratelimit";
import { getClientIp } from "@/lib/http/client-ip";
import { rateLimitHeaders, retryAfterSeconds } from "@/lib/http/ratelimit-headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HINT_MAX_LEN = 200;

type ErrorCode =
  | "invalid_image"
  | "image_too_large"
  | "unsupported_media"
  | "rate_limited"
  | "model_error"
  | "model_timeout";

function errorResponse(
  code: ErrorCode,
  message: string,
  status: number,
  extraHeaders: Record<string, string> = {},
): NextResponse {
  return NextResponse.json({ error: { code, message } }, { status, headers: extraHeaders });
}

export async function POST(request: Request): Promise<Response> {
  const requestId = randomUUID();

  const ip = getClientIp(request);
  const rl = await getLimiter("identify").check(ip);
  const baseHeaders = { ...rateLimitHeaders(rl), "X-Request-Id": requestId };
  if (!rl.ok) {
    return errorResponse("rate_limited", "Too many requests. Slow down.", 429, {
      ...baseHeaders,
      "Retry-After": String(retryAfterSeconds(rl)),
    });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse("invalid_image", "Could not parse multipart body.", 400, baseHeaders);
  }

  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    return errorResponse(
      "invalid_image",
      "Expected a non-empty 'image' field in multipart/form-data.",
      400,
      baseHeaders,
    );
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return errorResponse(
      "image_too_large",
      `Image exceeds the ${MAX_IMAGE_BYTES / 1024 / 1024} MB limit.`,
      413,
      baseHeaders,
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (bytes.length === 0) {
    return errorResponse("invalid_image", "Image payload is empty.", 400, baseHeaders);
  }

  const mimeType = detectImageMime(bytes);
  if (!mimeType) {
    return errorResponse(
      "unsupported_media",
      `Unsupported format. Supported: ${SUPPORTED_MIME_TYPES.join(", ")}.`,
      415,
      baseHeaders,
    );
  }

  const hintRaw = formData.get("hint");
  const hint =
    typeof hintRaw === "string" && hintRaw.length > 0 ? hintRaw.slice(0, HINT_MAX_LEN) : undefined;

  try {
    const { result, modelId, latencyMs } = await identifyFonts({
      imageBytes: Buffer.from(bytes),
      mimeType: mimeType as SupportedMimeType,
      hint,
    });

    const regions = result.regions.map((region) => ({
      id: region.id,
      description: region.description,
      sampleText: region.sampleText,
      bbox: region.bbox,
      candidates: region.candidates.map((c) => {
        const resolved = resolveSources(c.name);
        return {
          name: c.name,
          confidence: c.confidence,
          rationale: c.rationale,
          alternateFor: c.alternateFor,
          sources: resolved.sources,
          verified: resolved.verified,
        };
      }),
    }));

    return NextResponse.json(
      {
        regions,
        overallNotes: result.overallNotes,
        meta: { modelId, latencyMs, requestId },
      },
      { headers: baseHeaders },
    );
  } catch (err) {
    if (err instanceof ModelTimeoutError) {
      return errorResponse(
        "model_timeout",
        "The model call exceeded the 45 s limit.",
        504,
        baseHeaders,
      );
    }
    if (err instanceof ModelError) {
      return errorResponse("model_error", "The upstream model call failed.", 502, baseHeaders);
    }
    throw err;
  }
}
