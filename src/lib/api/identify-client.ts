import type { IdentifyApiError, IdentifyResponse } from "./identify-types";

export type IdentifyCallResult =
  | { ok: true; data: IdentifyResponse }
  | { ok: false; status: number; error: IdentifyApiError["error"]; retryAfter?: number };

export async function postIdentify(
  file: File,
  opts: { hint?: string; signal?: AbortSignal } = {},
): Promise<IdentifyCallResult> {
  const form = new FormData();
  form.append("image", file);
  if (opts.hint) form.append("hint", opts.hint);

  const response = await fetch("/api/identify", {
    method: "POST",
    body: form,
    signal: opts.signal ?? null,
  });

  if (response.ok) {
    const data = (await response.json()) as IdentifyResponse;
    return { ok: true, data };
  }

  let errorBody: IdentifyApiError | null = null;
  try {
    errorBody = (await response.json()) as IdentifyApiError;
  } catch {
    errorBody = null;
  }

  const retryAfterHeader = response.headers.get("Retry-After");
  const retryAfter = retryAfterHeader ? Number(retryAfterHeader) : undefined;

  return {
    ok: false,
    status: response.status,
    error: errorBody?.error ?? {
      code: "model_error",
      message: "Unexpected error.",
    },
    ...(retryAfter !== undefined && !Number.isNaN(retryAfter) ? { retryAfter } : {}),
  };
}
